// Provedores de pagamento (capítulo 9). O sistema nunca confia na tela de "pagamento aprovado":
// a liberação só acontece depois de consultar o provedor no servidor.

import { createHmac, timingSafeEqual } from "node:crypto";
import type { UserRole } from "@prisma/client";

export type ProviderStatus = "pending" | "approved" | "rejected" | "refunded" | "charged_back" | "cancelled";

export interface CheckoutRequest {
  orderId: string;
  title: string;
  quantity: number;
  unitPriceCents: number;
  payerEmail: string;
  appUrl: string;
}

export interface ProviderPayment {
  id: string;
  status: ProviderStatus;
  amountCents: number;
  orderId: string; // external_reference
  method?: string;
}

export interface PaymentProvider {
  name: string;
  createCheckout(req: CheckoutRequest): Promise<{ checkoutUrl: string; reference: string }>;
  getPayment(paymentId: string): Promise<ProviderPayment>;
  // Devolve o ID do pagamento a consultar, ou null se a notificação não for válida/relevante.
  parseWebhook(req: { url: string; headers: Headers; body: string }): string | null;
}

// ---------- Mercado Pago (Checkout Pro: Pix e cartão) ----------

const MP_API = "https://api.mercadopago.com";

export class MercadoPagoProvider implements PaymentProvider {
  name = "mercadopago";

  constructor(
    private readonly accessToken: string,
    private readonly webhookSecret: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private async call<T>(method: string, path: string, body?: unknown, idempotencyKey?: string): Promise<T> {
    const res = await this.fetchImpl(`${MP_API}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...(idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Mercado Pago respondeu ${res.status}: ${text.slice(0, 300)}`);
    return JSON.parse(text) as T;
  }

  async createCheckout(req: CheckoutRequest) {
    const pref = await this.call<{ id: string; init_point: string }>(
      "POST",
      "/checkout/preferences",
      {
        items: [
          {
            id: req.orderId,
            title: req.title,
            quantity: req.quantity,
            unit_price: req.unitPriceCents / 100,
            currency_id: "BRL",
          },
        ],
        payer: { email: req.payerEmail },
        external_reference: req.orderId,
        notification_url: `${req.appUrl}/api/pagamentos/webhook`,
        back_urls: {
          success: `${req.appUrl}/pedidos/${req.orderId}`,
          pending: `${req.appUrl}/pedidos/${req.orderId}`,
          failure: `${req.appUrl}/pedidos/${req.orderId}`,
        },
        auto_return: "approved",
        expires: true,
        expiration_date_to: new Date(Date.now() + 24 * 3600_000).toISOString(),
      },
      `preference-${req.orderId}`,
    );
    return { checkoutUrl: pref.init_point, reference: pref.id };
  }

  async getPayment(paymentId: string): Promise<ProviderPayment> {
    const p = await this.call<{
      id: number;
      status: string;
      transaction_amount: number;
      external_reference: string;
      payment_type_id?: string;
    }>("GET", `/v1/payments/${encodeURIComponent(paymentId)}`);
    return {
      id: String(p.id),
      status: (["pending", "approved", "rejected", "refunded", "charged_back", "cancelled"].includes(p.status)
        ? p.status
        : "pending") as ProviderStatus,
      amountCents: Math.round(p.transaction_amount * 100),
      orderId: p.external_reference,
      method: p.payment_type_id === "bank_transfer" ? "pix" : p.payment_type_id,
    };
  }

  // Assinatura do Mercado Pago: x-signature "ts=...,v1=..." sobre "id:{data.id};request-id:{x-request-id};ts:{ts};"
  parseWebhook({ url, headers, body }: { url: string; headers: Headers; body: string }): string | null {
    const u = new URL(url);
    let dataId = u.searchParams.get("data.id");
    let type = u.searchParams.get("type");
    if (!dataId) {
      try {
        const parsed = JSON.parse(body) as { type?: string; data?: { id?: string | number } };
        dataId = parsed.data?.id ? String(parsed.data.id) : null;
        type = type ?? parsed.type ?? null;
      } catch {
        return null;
      }
    }
    if (type !== "payment" || !dataId) return null;

    const sig = headers.get("x-signature") ?? "";
    const parts = Object.fromEntries(sig.split(",").map((kv) => kv.trim().split("=") as [string, string]));
    if (!parts.ts || !parts.v1) return null;
    const id = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId;
    const manifest = `id:${id};request-id:${headers.get("x-request-id") ?? ""};ts:${parts.ts};`;
    const expected = createHmac("sha256", this.webhookSecret).update(manifest).digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(parts.v1);
    return a.length === b.length && timingSafeEqual(a, b) ? dataId : null;
  }
}

// ---------- Provedor simulado (desenvolvimento e testes) ----------
// O "checkout" é uma página do próprio app que aprova ou recusa o pedido diretamente
// (ver /pagamento-teste). Só é usado quando não há token do Mercado Pago; nunca em produção.

export class FakeProvider implements PaymentProvider {
  name = "fake";

  async createCheckout(req: CheckoutRequest) {
    return { checkoutUrl: `${req.appUrl}/pagamento-teste/${req.orderId}`, reference: `fake-${req.orderId}` };
  }

  async getPayment(): Promise<ProviderPayment> {
    throw new Error("O provedor simulado não recebe webhooks");
  }

  parseWebhook() {
    return null;
  }
}

// Em produção, o pagamento simulado só serve para a equipe testar o fluxo de ponta a ponta:
// um lojista nunca consegue importar sem pagar.
export function canUseFakePayments(role: UserRole): boolean {
  return process.env.NODE_ENV !== "production" || role === "ADMIN" || role === "FINANCE";
}

let provider: PaymentProvider | null = null;

export function resetPaymentProviderForTests() {
  provider = null;
}

export function paymentProvider(): PaymentProvider {
  if (provider) return provider;
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (token) {
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET ?? "";
    // Sem segredo, a assinatura do webhook seria um HMAC com chave vazia, que qualquer um calcula.
    if (!secret && process.env.NODE_ENV === "production") {
      throw new Error("MERCADOPAGO_WEBHOOK_SECRET não configurado");
    }
    provider = new MercadoPagoProvider(token, secret);
  } else {
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_FAKE_PAYMENTS !== "1") {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");
    }
    provider = new FakeProvider();
  }
  return provider;
}
