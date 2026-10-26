// Motor de importação (capítulos 5, 8 e 10). Roda no worker, fora do Next.
// Fluxo de um item: reservado → processando → concluído (consome a unidade) ou falhou (devolve a reserva).
// Repetir a tarefa nunca cria um segundo anúncio: antes de criar, procura o produto pelo SKU na loja.

import { prisma } from "@/lib/db";
import { ledgerKey } from "@/lib/credits";
import { decryptSecret } from "@/lib/crypto";
import { addLedger } from "@/lib/ledger";
import { NuvemshopClient, NuvemshopError, toNuvemshopPayload } from "@/lib/nuvemshop";
import type { ImportSettings } from "@/lib/orders";

export type ClientFactory = (store: { externalStoreId: string; accessToken: string }) => Pick<
  NuvemshopClient,
  "createProduct" | "findProductBySku"
>;

const defaultFactory: ClientFactory = ({ externalStoreId, accessToken }) =>
  new NuvemshopClient({ storeId: externalStoreId, accessToken });

export class RetryableImportError extends Error {}

export type ItemResult = "done" | "failed" | "skipped";

export function salePriceCents(suggested: number | null, s: ImportSettings): number | null {
  if (s.priceMode === "none" || suggested === null) return null;
  const base = Math.round(suggested * 100);
  return s.priceMode === "markup" ? Math.round(base * (1 + s.markupPercent / 100)) : base;
}

// isLastAttempt: quando true, um erro temporário vira falha definitiva (a reserva é devolvida).
export async function processImportItem(
  importItemId: string,
  opts: { isLastAttempt?: boolean; clientFactory?: ClientFactory } = {},
): Promise<ItemResult> {
  const item = await prisma.importItem.findUnique({
    where: { id: importItemId },
    include: {
      store: true,
      batch: { include: { order: true } },
      product: { include: { variants: true, media: { orderBy: { position: "asc" } } } },
    },
  });
  if (!item) return "skipped";
  if (item.status === "DONE" || item.status === "SKIPPED") return item.status === "DONE" ? "done" : "skipped";
  if (item.batch.order.status !== "PAID") return "skipped"; // pagamento sem confirmação não publica

  const accountId = item.batch.order.accountId;
  const fail = async (message: string) => {
    await prisma.$transaction(async (tx) => {
      await tx.importItem.update({ where: { id: item.id }, data: { status: "FAILED", lastError: message } });
      await addLedger(tx, {
        accountId,
        orderId: item.batch.orderId,
        importItemId: item.id,
        type: "RELEASE",
        key: ledgerKey.release(item.id, item.retryRound),
      });
    });
    await refreshBatch(item.batchId);
    return "failed" as const;
  };

  if (item.store.status !== "CONNECTED" || !item.store.accessTokenEnc) {
    return fail("A loja foi desconectada. Reconecte e peça o reprocessamento.");
  }
  if (item.product.status !== "APPROVED") {
    return fail("Produto retirado do catálogo antes do envio.");
  }

  await prisma.importItem.update({
    where: { id: item.id },
    data: { status: "PROCESSING", attempts: { increment: 1 }, productVersion: item.product.version },
  });

  const client = (opts.clientFactory ?? defaultFactory)({
    externalStoreId: item.store.externalStoreId,
    accessToken: decryptSecret(item.store.accessTokenEnc),
  });
  const settings = item.batch.settings as unknown as ImportSettings;

  try {
    let payload;
    try {
      payload = toNuvemshopPayload(
        {
          name: item.product.name,
          description: item.product.description,
          brand: item.product.brand,
          images: item.product.media,
          variants: item.product.variants.map((v) => ({
            sku: v.sku,
            options: v.options as Record<string, string>,
            gtin: v.gtin,
          })),
        },
        {
          language: "pt",
          publish: settings.publish,
          stock: settings.stock,
          priceCents: salePriceCents(item.product.suggestedPrice ? Number(item.product.suggestedPrice) : null, settings),
        },
      );
    } catch (e) {
      return await fail(`Dados do produto incompatíveis: ${(e as Error).message}`);
    }

    // Reconciliação: se uma tentativa anterior criou o produto e a resposta se perdeu, ele já está lá.
    const existing = await client.findProductBySku(item.product.variants[0].sku);
    const externalId = existing ? existing.id : (await client.createProduct(payload)).id;

    await prisma.$transaction(async (tx) => {
      await tx.importItem.update({
        where: { id: item.id },
        data: { status: "DONE", externalProductId: String(externalId), lastError: null },
      });
      await addLedger(tx, {
        accountId,
        orderId: item.batch.orderId,
        importItemId: item.id,
        type: "CONSUME",
        key: ledgerKey.consume(item.id),
      });
    });
    await refreshBatch(item.batchId);
    return "done";
  } catch (e) {
    const retryable = !(e instanceof NuvemshopError) || e.retryable;
    const message = e instanceof NuvemshopError ? friendlyError(e) : (e as Error).message;
    if (retryable && !opts.isLastAttempt) {
      await prisma.importItem.update({ where: { id: item.id }, data: { status: "QUEUED", lastError: message } });
      throw new RetryableImportError(message);
    }
    return fail(message);
  }
}

function friendlyError(e: NuvemshopError): string {
  if (e.status === 401 || e.status === 403) return "A Nuvemshop recusou o acesso. Reconecte a loja.";
  if (e.status === 422) {
    const body = e.body as Record<string, string[]> | null;
    const detail = body ? Object.entries(body).map(([k, v]) => `${k}: ${[v].flat().join(", ")}`).join("; ") : "";
    return `A Nuvemshop recusou o produto${detail ? ` (${detail})` : ""}.`;
  }
  if (e.status === 0) return "Falha de conexão com a Nuvemshop.";
  return `A Nuvemshop respondeu com erro ${e.status}.`;
}

// Recalcula o progresso do lote a partir dos itens (fonte da verdade).
export async function refreshBatch(batchId: string) {
  const counts = await prisma.importItem.groupBy({ by: ["status"], where: { batchId }, _count: true });
  const n = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const total = counts.reduce((a, c) => a + c._count, 0);
  const done = n("DONE");
  const failed = n("FAILED");
  const terminal = done + failed + n("SKIPPED");
  const status =
    terminal < total ? "PROCESSING" : failed === 0 ? "FINISHED" : done === 0 ? "FAILED" : "PARTIAL";
  await prisma.importBatch.update({ where: { id: batchId }, data: { succeeded: done, failed, status } });
}

// Reprocessamento gratuito dos itens que falharam (capítulo 5): reserva de novo a unidade devolvida.
export async function retryFailedItems(batchId: string, accountId: string): Promise<{ ids: string[]; round: number }> {
  return prisma.$transaction(async (tx) => {
    const batch = await tx.importBatch.findFirst({ where: { id: batchId, order: { accountId, status: "PAID" } } });
    if (!batch) return { ids: [], round: 0 };
    const failed = await tx.importItem.findMany({ where: { batchId, status: "FAILED" } });
    let round = 0;
    for (const item of failed) {
      round = Math.max(round, item.retryRound + 1);
      await tx.importItem.update({
        where: { id: item.id },
        data: { status: "RESERVED", retryRound: { increment: 1 }, lastError: null },
      });
      await addLedger(tx, {
        accountId,
        orderId: batch.orderId,
        importItemId: item.id,
        type: "RESERVE",
        key: ledgerKey.reserve(item.id, item.retryRound + 1),
      });
    }
    if (failed.length) await tx.importBatch.update({ where: { id: batchId }, data: { status: "PROCESSING" } });
    return { ids: failed.map((i) => i.id), round };
  });
}
