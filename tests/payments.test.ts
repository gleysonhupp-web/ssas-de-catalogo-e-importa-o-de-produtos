import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { MercadoPagoProvider } from "@/lib/payments";

const mp = (fetchImpl = vi.fn()) => new MercadoPagoProvider("token", "segredo", fetchImpl);

function signed(dataId: string, requestId: string, ts = "1700000000") {
  const v1 = createHmac("sha256", "segredo").update(`id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`).digest("hex");
  return new Headers({ "x-signature": `ts=${ts},v1=${v1}`, "x-request-id": requestId });
}

describe("MercadoPagoProvider.parseWebhook", () => {
  it("aceita notificação de pagamento com assinatura válida", () => {
    const headers = signed("123456", "req-1");
    expect(mp().parseWebhook({ url: "https://app/api/pagamentos/webhook?data.id=123456&type=payment", headers, body: "{}" })).toBe("123456");
  });

  it("recusa assinatura inválida ou evento que não é pagamento", () => {
    const headers = signed("123456", "req-1");
    expect(mp().parseWebhook({ url: "https://app/x?data.id=999&type=payment", headers, body: "{}" })).toBeNull();
    expect(mp().parseWebhook({ url: "https://app/x?data.id=123456&type=merchant_order", headers, body: "{}" })).toBeNull();
    expect(mp().parseWebhook({ url: "https://app/x?data.id=123456&type=payment", headers: new Headers(), body: "{}" })).toBeNull();
  });

  it("lê o id do corpo quando não vem na URL", () => {
    const headers = signed("777", "req-2");
    const body = JSON.stringify({ type: "payment", data: { id: "777" } });
    expect(mp().parseWebhook({ url: "https://app/x", headers, body })).toBe("777");
  });
});

describe("MercadoPagoProvider.getPayment", () => {
  it("converte valor para centavos e Pix para 'pix'", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 1, status: "approved", transaction_amount: 62.5, external_reference: "ord1", payment_type_id: "bank_transfer" })),
    );
    await expect(mp(fetchImpl).getPayment("1")).resolves.toEqual({ id: "1", status: "approved", amountCents: 6250, orderId: "ord1", method: "pix" });
  });
});

describe("MercadoPagoProvider.createCheckout", () => {
  it("cria a preferência com referência do pedido e chave de idempotência", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "pref", init_point: "https://mp/checkout" })));
    const r = await mp(fetchImpl).createCheckout({ orderId: "ord1", title: "50 produtos", quantity: 50, unitPriceCents: 125, payerEmail: "a@b.com", appUrl: "https://app" });
    expect(r).toEqual({ checkoutUrl: "https://mp/checkout", reference: "pref" });
    const [, init] = fetchImpl.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.items[0]).toMatchObject({ quantity: 50, unit_price: 1.25, currency_id: "BRL" });
    expect(body.external_reference).toBe("ord1");
    expect(init.headers["X-Idempotency-Key"]).toBe("preference-ord1");
  });
});
