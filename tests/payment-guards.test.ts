import { afterEach, describe, expect, it, vi } from "vitest";
import { canUseFakePayments, paymentProvider, resetPaymentProviderForTests } from "@/lib/payments";

afterEach(() => {
  vi.unstubAllEnvs();
  resetPaymentProviderForTests();
});

describe("pagamento simulado", () => {
  it("em produção só a equipe financeira e o admin podem simular", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(canUseFakePayments("MERCHANT")).toBe(false);
    expect(canUseFakePayments("CONTENT_OPERATOR")).toBe(false);
    expect(canUseFakePayments("FINANCE")).toBe(true);
    expect(canUseFakePayments("ADMIN")).toBe(true);
  });

  it("fora de produção qualquer conta pode simular", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(canUseFakePayments("MERCHANT")).toBe(true);
  });
});

describe("configuração do Mercado Pago", () => {
  it("em produção recusa token sem segredo de webhook", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", "TEST-token");
    vi.stubEnv("MERCADOPAGO_WEBHOOK_SECRET", "");
    expect(() => paymentProvider()).toThrow("MERCADOPAGO_WEBHOOK_SECRET");
  });

  it("com token e segredo usa o Mercado Pago", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", "TEST-token");
    vi.stubEnv("MERCADOPAGO_WEBHOOK_SECRET", "segredo");
    expect(paymentProvider().name).toBe("mercadopago");
  });

  it("em produção sem token e sem liberação explícita não cai no simulado", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", "");
    vi.stubEnv("ALLOW_FAKE_PAYMENTS", "");
    expect(() => paymentProvider()).toThrow("MERCADOPAGO_ACCESS_TOKEN");
  });
});
