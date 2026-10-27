import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { retryFailedItems } from "@/lib/importer";
import { applyProviderPayment, createOrderFromCart, DEFAULT_SETTINGS } from "@/lib/orders";
import { merchantWithCart } from "./fixtures";

// Cenário obrigatório 4: uma conta não alcança dados de outra trocando IDs.
describe("isolamento entre contas", () => {
  it("não cria pedido com a loja de outra conta", async () => {
    const a = await merchantWithCart(1);
    const b = await merchantWithCart(1);
    await expect(createOrderFromCart(a.account.id, b.store.id, DEFAULT_SETTINGS)).rejects.toThrow("Conecte sua loja");
  });

  it("não reprocessa o lote de outra conta", async () => {
    const a = await merchantWithCart(1);
    const b = await merchantWithCart(1);
    const order = await createOrderFromCart(b.account.id, b.store.id, DEFAULT_SETTINGS);
    await applyProviderPayment("test", { id: `p-${order.id}`, status: "approved", amountCents: order.totalCents, orderId: order.id });
    const batch = await prisma.importBatch.findUniqueOrThrow({ where: { orderId: order.id } });
    await prisma.importItem.updateMany({ where: { batchId: batch.id }, data: { status: "FAILED" } });
    expect(await retryFailedItems(batch.id, a.account.id)).toEqual({ ids: [], round: 0 });
    expect(await prisma.importItem.count({ where: { batchId: batch.id, status: "FAILED" } })).toBe(1);
  });
});
