import { describe, expect, it } from "vitest";
import { computeBalance } from "@/lib/credits";
import { prisma } from "@/lib/db";
import { applyProviderPayment, createOrderFromCart, DEFAULT_SETTINGS } from "@/lib/orders";
import { merchantWithCart } from "./fixtures";

async function balance(accountId: string) {
  return computeBalance(await prisma.creditLedgerEntry.findMany({ where: { accountId } }));
}

const approved = (orderId: string, amountCents: number, id = `pay-${orderId}`) =>
  ({ id, status: "approved", amountCents, orderId, method: "pix" }) as const;

describe("pedido e pagamento", () => {
  it("trava o preço e lista só os produtos cobráveis", async () => {
    const { account, store } = await merchantWithCart(4);
    const order = await createOrderFromCart(account.id, store.id, DEFAULT_SETTINGS);
    expect(order).toMatchObject({ status: "PENDING_PAYMENT", quantity: 4, unitPriceCents: 125, totalCents: 500 });
  });

  it("pagamento pendente não libera nada", async () => {
    const { account, store } = await merchantWithCart(2);
    const order = await createOrderFromCart(account.id, store.id, DEFAULT_SETTINGS);
    const r = await applyProviderPayment("test", { ...approved(order.id, 250), status: "pending" });
    expect(r.kind).toBe("pending");
    expect(await prisma.importItem.count({ where: { batch: { orderId: order.id } } })).toBe(0);
  });

  it("libera o lote uma única vez mesmo com webhooks repetidos e simultâneos", async () => {
    const { account, store } = await merchantWithCart(3);
    const order = await createOrderFromCart(account.id, store.id, DEFAULT_SETTINGS);
    const results = await Promise.all([1, 2, 3].map(() => applyProviderPayment("test", approved(order.id, 375))));
    expect(results.filter((r) => r.kind === "released")).toHaveLength(1);
    expect(results.filter((r) => r.kind === "already_processed")).toHaveLength(2);
    expect(await prisma.importItem.count({ where: { batch: { orderId: order.id } } })).toBe(3);
    expect(await balance(account.id)).toEqual({ available: 0, reserved: 3, consumed: 0 });
    expect(await prisma.cartItem.count({ where: { accountId: account.id } })).toBe(0);
  });

  it("valor diferente do pedido não libera", async () => {
    const { account, store } = await merchantWithCart(2);
    const order = await createOrderFromCart(account.id, store.id, DEFAULT_SETTINGS);
    expect((await applyProviderPayment("test", approved(order.id, 100))).kind).toBe("amount_mismatch");
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PENDING_PAYMENT");
  });

  it("produto já comprado para a mesma loja não é cobrado de novo", async () => {
    const { account, store, products } = await merchantWithCart(2);
    const order = await createOrderFromCart(account.id, store.id, DEFAULT_SETTINGS);
    await applyProviderPayment("test", approved(order.id, 250));
    await prisma.cartItem.create({ data: { accountId: account.id, catalogProductId: products[0].id } });
    await expect(createOrderFromCart(account.id, store.id, DEFAULT_SETTINGS)).rejects.toThrow("Não há produtos cobráveis");
  });

  it("estorno devolve as unidades ainda não usadas", async () => {
    const { account, store } = await merchantWithCart(2);
    const order = await createOrderFromCart(account.id, store.id, DEFAULT_SETTINGS);
    await applyProviderPayment("test", approved(order.id, 250));
    expect((await applyProviderPayment("test", { ...approved(order.id, 250), status: "refunded" })).kind).toBe("refunded");
    expect((await applyProviderPayment("test", { ...approved(order.id, 250), status: "refunded" })).kind).toBe("refunded");
    expect(await balance(account.id)).toEqual({ available: 0, reserved: 0, consumed: 0 });
  });
});
