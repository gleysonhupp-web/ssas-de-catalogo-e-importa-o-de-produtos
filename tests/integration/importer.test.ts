import { describe, expect, it } from "vitest";
import { computeBalance } from "@/lib/credits";
import { encryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { processImportItem, retryFailedItems, type ClientFactory } from "@/lib/importer";
import { NuvemshopError, type NuvemshopProductPayload } from "@/lib/nuvemshop";
import { applyProviderPayment, createOrderFromCart, DEFAULT_SETTINGS } from "@/lib/orders";
import { merchantWithCart } from "./fixtures";

// Loja simulada em memória: guarda os produtos criados e permite injetar falhas.
function fakeStore(behavior: { failSku?: (sku: string) => NuvemshopError | null; loseResponseOnce?: Set<string> } = {}) {
  const products = new Map<string, { id: number; payload: NuvemshopProductPayload }>();
  let nextId = 1;
  const factory: ClientFactory = () => ({
    async findProductBySku(sku) {
      const p = products.get(sku);
      return p ? { id: p.id } : null;
    },
    async createProduct(payload) {
      const sku = payload.variants[0].sku;
      const err = behavior.failSku?.(sku);
      if (err) throw err;
      const p = { id: nextId++, payload };
      products.set(sku, p);
      if (behavior.loseResponseOnce?.delete(sku)) throw new NuvemshopError("Erro de rede: timeout", 0, true);
      return { id: p.id };
    },
  });
  return { products, factory };
}

async function paidBatch(n: number) {
  const ctx = await merchantWithCart(n);
  await prisma.store.update({ where: { id: ctx.store.id }, data: { accessTokenEnc: encryptSecret("tok") } });
  const order = await createOrderFromCart(ctx.account.id, ctx.store.id, DEFAULT_SETTINGS);
  const outcome = await applyProviderPayment("test", { id: `p-${order.id}`, status: "approved", amountCents: order.totalCents, orderId: order.id });
  if (outcome.kind !== "released") throw new Error("lote não liberado");
  const items = await prisma.importItem.findMany({ where: { batchId: outcome.batchId }, include: { product: { include: { variants: true } } } });
  return { ...ctx, order, batchId: outcome.batchId, items };
}

const balance = async (accountId: string) =>
  computeBalance(await prisma.creditLedgerEntry.findMany({ where: { accountId } }));

describe("motor de importação", () => {
  it("50 produtos criados geram 50 IDs externos e 50 consumos", async () => {
    const { account, batchId, items } = await paidBatch(50);
    const store = fakeStore();
    for (const i of items) expect(await processImportItem(i.id, { clientFactory: store.factory })).toBe("done");
    expect(store.products.size).toBe(50);
    const done = await prisma.importItem.findMany({ where: { batchId } });
    expect(new Set(done.map((d) => d.externalProductId)).size).toBe(50);
    expect(await balance(account.id)).toEqual({ available: 0, reserved: 0, consumed: 50 });
    expect(await prisma.importBatch.findUniqueOrThrow({ where: { id: batchId } })).toMatchObject({ status: "FINISHED", succeeded: 50 });
  }, 60_000);

  it("falha parcial é separada e o reprocessamento não cobra de novo", async () => {
    const { account, batchId, items, order } = await paidBatch(10);
    const bad = new Set(items.slice(0, 2).map((i) => i.product.variants[0].sku));
    const store = fakeStore({ failSku: (sku) => (bad.has(sku) ? new NuvemshopError("422", 422, false, { images: ["inválida"] }) : null) });
    for (const i of items) await processImportItem(i.id, { clientFactory: store.factory });
    expect(await prisma.importBatch.findUniqueOrThrow({ where: { id: batchId } })).toMatchObject({ status: "PARTIAL", succeeded: 8, failed: 2 });
    expect(await balance(account.id)).toEqual({ available: 2, reserved: 0, consumed: 8 });
    const failedItem = await prisma.importItem.findFirstOrThrow({ where: { batchId, status: "FAILED" } });
    expect(failedItem.lastError).toContain("recusou o produto");

    bad.clear(); // "corrigimos a imagem"
    const { ids } = await retryFailedItems(batchId, account.id);
    expect(ids).toHaveLength(2);
    for (const id of ids) await processImportItem(id, { clientFactory: store.factory });
    expect(await prisma.importBatch.findUniqueOrThrow({ where: { id: batchId } })).toMatchObject({ status: "FINISHED", succeeded: 10, failed: 0 });
    expect(await balance(account.id)).toEqual({ available: 0, reserved: 0, consumed: 10 });
    expect(await prisma.payment.count({ where: { orderId: order.id } })).toBe(1);
  });

  it("resposta perdida não gera anúncio duplicado", async () => {
    const { items } = await paidBatch(1);
    const sku = items[0].product.variants[0].sku;
    const store = fakeStore({ loseResponseOnce: new Set([sku]) });
    await expect(processImportItem(items[0].id, { clientFactory: store.factory })).rejects.toThrow("Falha de conexão");
    expect(await processImportItem(items[0].id, { clientFactory: store.factory })).toBe("done");
    expect(await processImportItem(items[0].id, { clientFactory: store.factory })).toBe("done");
    expect(store.products.size).toBe(1);
  });

  it("erro temporário na última tentativa devolve a reserva", async () => {
    const { account, items } = await paidBatch(1);
    const store = fakeStore({ failSku: () => new NuvemshopError("500", 500, true) });
    await expect(processImportItem(items[0].id, { clientFactory: store.factory })).rejects.toThrow();
    expect(await processImportItem(items[0].id, { clientFactory: store.factory, isLastAttempt: true })).toBe("failed");
    expect(await balance(account.id)).toEqual({ available: 1, reserved: 0, consumed: 0 });
  });

  it("loja desconectada não publica e devolve a reserva", async () => {
    const { account, store: s, items } = await paidBatch(1);
    await prisma.store.update({ where: { id: s.id }, data: { status: "REVOKED" } });
    const store = fakeStore();
    expect(await processImportItem(items[0].id, { clientFactory: store.factory })).toBe("failed");
    expect(store.products.size).toBe(0);
    expect(await balance(account.id)).toEqual({ available: 1, reserved: 0, consumed: 0 });
  });

  it("aplica o preço escolhido e cria oculto por padrão", async () => {
    const { items } = await paidBatch(1);
    const store = fakeStore();
    await processImportItem(items[0].id, { clientFactory: store.factory });
    const [p] = [...store.products.values()];
    expect(p.payload.published).toBe(false);
    expect(p.payload.variants[0]).toMatchObject({ price: "10.00", stock: 0 });
  });
});
