import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { quote } from "@/lib/pricing";
import { ledgerKey } from "@/lib/credits";
import { addLedger } from "@/lib/ledger";
import type { ProviderPayment } from "@/lib/payments";

// Pedidos e pagamentos (capítulos 5 e 9).
// Invariantes: pagamento sem confirmação não publica; reenvio de webhook não duplica crédito;
// o valor cobrado precisa bater com o resumo que o cliente viu.

export const ORDER_TTL_MS = 24 * 3600_000;

export interface ImportSettings {
  priceMode: "suggested" | "markup" | "none"; // preço sugerido, sugerido + %, ou sem preço (lojista define)
  markupPercent: number;
  publish: boolean; // false = criar oculto para revisão
  stock: number | null; // null = ilimitado
}

export const DEFAULT_SETTINGS: ImportSettings = { priceMode: "suggested", markupPercent: 0, publish: false, stock: 0 };

export class CheckoutError extends Error {}

// Produtos do carrinho que podem ser cobrados para esta loja: aprovados e sem importação anterior.
// Um item que falhou antes já tem direito a reprocessamento grátis, então também não é cobrado de novo.
export async function billableCartProducts(accountId: string, storeId: string) {
  const cart = await prisma.cartItem.findMany({
    where: { accountId },
    include: { product: { select: { id: true, status: true, version: true } } },
  });
  const existing = new Set(
    (
      await prisma.importItem.findMany({
        where: { storeId, catalogProductId: { in: cart.map((c) => c.catalogProductId) } },
        select: { catalogProductId: true },
      })
    ).map((i) => i.catalogProductId),
  );
  return cart.filter((c) => c.product.status === "APPROVED" && !existing.has(c.catalogProductId)).map((c) => c.product);
}

export async function createOrderFromCart(accountId: string, storeId: string, settings: ImportSettings) {
  const store = await prisma.store.findFirst({ where: { id: storeId, accountId, status: "CONNECTED" } });
  if (!store) throw new CheckoutError("Conecte sua loja Nuvemshop antes de pagar");

  const products = await billableCartProducts(accountId, storeId);
  if (products.length === 0) throw new CheckoutError("Não há produtos cobráveis no carrinho");
  const q = quote(products.length); // preço travado agora; não muda se a tabela mudar depois

  return prisma.$transaction(async (tx) => {
    // Pedidos pendentes anteriores da mesma conta deixam de valer para não haver dois checkouts abertos.
    await tx.order.updateMany({
      where: { accountId, status: "PENDING_PAYMENT" },
      data: { status: "CANCELED" },
    });
    return tx.order.create({
      data: {
        accountId,
        storeId,
        status: "PENDING_PAYMENT",
        unitPriceCents: q.unitPriceCents,
        quantity: q.quantity,
        totalCents: q.totalCents,
        expiresAt: new Date(Date.now() + ORDER_TTL_MS),
        items: { create: products.map((p) => ({ catalogProductId: p.id, productVersion: p.version })) },
        batch: {
          create: {
            storeId,
            status: "AWAITING_PAYMENT",
            total: products.length,
            settings: settings as unknown as Prisma.InputJsonValue,
          },
        },
      },
    });
  });
}

export type PaymentOutcome =
  | { kind: "released"; batchId: string }
  | { kind: "already_processed" }
  | { kind: "pending" }
  | { kind: "rejected" }
  | { kind: "amount_mismatch" }
  | { kind: "expired" }
  | { kind: "refunded" };

// Aplica o estado consultado no provedor. Idempotente: pode ser chamada várias vezes para o mesmo pagamento.
export async function applyProviderPayment(provider: string, payment: ProviderPayment): Promise<PaymentOutcome> {
  return prisma.$transaction(
    async (tx) => {
      // Trava o pedido para que dois webhooks simultâneos não liberem o lote duas vezes.
      await tx.$executeRaw`SELECT id FROM "Order" WHERE id = ${payment.orderId} FOR UPDATE`;
      const order = await tx.order.findUnique({
        where: { id: payment.orderId },
        include: { items: true, batch: true },
      });
      if (!order || !order.batch) return { kind: "rejected" } as const;

      // O checkout cria o registro sem ID do provedor; a primeira notificação completa esse registro.
      await tx.payment.updateMany({
        where: { orderId: order.id, provider, providerPaymentId: null },
        data: { providerPaymentId: payment.id },
      });
      const paymentRow = await tx.payment.upsert({
        where: { provider_providerPaymentId: { provider, providerPaymentId: payment.id } },
        update: { method: payment.method },
        create: {
          orderId: order.id,
          provider,
          providerPaymentId: payment.id,
          method: payment.method,
          amountCents: payment.amountCents,
          status: "PENDING",
        },
      });

      if (payment.status === "refunded" || payment.status === "charged_back") {
        await tx.payment.update({
          where: { id: paymentRow.id },
          data: { status: payment.status === "refunded" ? "REFUNDED" : "DISPUTED" },
        });
        // Itens ainda não concluídos deixam de ser importados; o que já foi criado fica no histórico.
        const pending = await tx.importItem.findMany({
          where: { batchId: order.batch.id, status: { notIn: ["DONE", "SKIPPED"] } },
        });
        for (const item of pending) {
          await tx.importItem.update({ where: { id: item.id }, data: { status: "SKIPPED", lastError: "Pagamento estornado" } });
          await addLedger(tx, { accountId: order.accountId, orderId: order.id, importItemId: item.id, type: "RELEASE", key: ledgerKey.release(item.id, -1) });
          await addLedger(tx, { accountId: order.accountId, orderId: order.id, importItemId: item.id, type: "REFUND", key: ledgerKey.refund(order.id, item.id) });
        }
        return { kind: "refunded" } as const;
      }

      if (payment.status === "pending") return { kind: "pending" } as const;
      if (payment.status !== "approved") {
        await tx.payment.update({ where: { id: paymentRow.id }, data: { status: "FAILED" } });
        return { kind: "rejected" } as const;
      }

      if (order.status === "PAID") return { kind: "already_processed" } as const;
      if (payment.amountCents !== order.totalCents) {
        // Valor diferente do resumo validado: não libera e deixa para o financeiro.
        await tx.payment.update({ where: { id: paymentRow.id }, data: { status: "DISPUTED" } });
        await tx.auditLog.create({
          data: {
            event: "payment.amount_mismatch",
            entity: "Order",
            entityId: order.id,
            after: { expected: order.totalCents, received: payment.amountCents },
          },
        });
        return { kind: "amount_mismatch" } as const;
      }
      if (order.status !== "PENDING_PAYMENT") {
        // Pagamento aprovado para pedido cancelado ou expirado: registrado para estorno manual.
        await tx.payment.update({ where: { id: paymentRow.id }, data: { status: "CONFIRMED" } });
        await tx.auditLog.create({ data: { event: "payment.late", entity: "Order", entityId: order.id } });
        return { kind: "expired" } as const;
      }

      await tx.payment.update({ where: { id: paymentRow.id }, data: { status: "CONFIRMED" } });
      await tx.order.update({ where: { id: order.id }, data: { status: "PAID" } });
      await addLedger(tx, { accountId: order.accountId, orderId: order.id, type: "GRANT", quantity: order.quantity, key: ledgerKey.grant(order.id) });

      // Cria as linhas de importação e reserva uma unidade para cada uma.
      for (const item of order.items) {
        const importItem = await tx.importItem.create({
          data: {
            batchId: order.batch.id,
            storeId: order.storeId,
            catalogProductId: item.catalogProductId,
            productVersion: item.productVersion,
            status: "RESERVED",
          },
        });
        await addLedger(tx, { accountId: order.accountId, orderId: order.id, importItemId: importItem.id, type: "RESERVE", key: ledgerKey.reserve(importItem.id) });
      }
      await tx.importBatch.update({ where: { id: order.batch.id }, data: { status: "RELEASED" } });
      await tx.cartItem.deleteMany({
        where: { accountId: order.accountId, catalogProductId: { in: order.items.map((i) => i.catalogProductId) } },
      });
      await tx.auditLog.create({ data: { event: "order.paid", entity: "Order", entityId: order.id, after: { amountCents: payment.amountCents } } });
      return { kind: "released", batchId: order.batch.id } as const;
    },
    { isolationLevel: "ReadCommitted", timeout: 30_000 },
  );
}

export async function expireStaleOrders(now = new Date()) {
  return prisma.order.updateMany({
    where: { status: "PENDING_PAYMENT", expiresAt: { lt: now } },
    data: { status: "EXPIRED" },
  });
}
