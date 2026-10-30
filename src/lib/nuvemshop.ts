// Cliente da API oficial da Nuvemshop (capítulo 8).
// Documentação: https://nuvemshop.dev/en-US/api/getting-started
//   - OAuth: /apps/{app_id}/authorize → POST /apps/authorize/token (JSON)
//   - API:   https://api.nuvemshop.com.br/{versão}/{store_id}, header Authorization: Bearer
//   - Limite: balde de 40 requisições, vazão de 2/s; 429 deve ser reenviado depois do reset.

import { createHmac, timingSafeEqual } from "node:crypto";

// Sobrescrevíveis por variável de ambiente para testes contra um servidor simulado.
const AUTH_BASE = process.env.NUVEMSHOP_AUTH_BASE ?? "https://www.nuvemshop.com.br";
const API_BASE = process.env.NUVEMSHOP_API_BASE ?? "https://api.nuvemshop.com.br";
export const API_VERSION = "2025-03";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} não configurada`);
  return v;
}

export function authorizeUrl(state: string): string {
  return `${AUTH_BASE}/apps/${encodeURIComponent(env("NUVEMSHOP_CLIENT_ID"))}/authorize?state=${encodeURIComponent(state)}`;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  user_id: number; // ID da loja
}

export async function exchangeCode(code: string, fetchImpl: typeof fetch = fetch): Promise<TokenResponse> {
  const res = await fetchImpl(`${AUTH_BASE}/apps/authorize/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env("NUVEMSHOP_CLIENT_ID"),
      client_secret: env("NUVEMSHOP_CLIENT_SECRET"),
      grant_type: "authorization_code",
      code,
    }),
  });
  const body = (await res.json()) as Partial<TokenResponse> & { error?: string; error_description?: string };
  if (!res.ok || !body.access_token || !body.user_id) {
    throw new Error(`Falha ao autorizar a loja: ${body.error_description ?? body.error ?? res.status}`);
  }
  return body as TokenResponse;
}

// Webhooks da Nuvemshop vêm assinados com HMAC-SHA256 do corpo usando o client secret.
export function verifyWebhook(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", env("NUVEMSHOP_CLIENT_SECRET")).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Eventos de privacidade (LGPD) chegam sem o campo "event" no corpo: cada um é configurado no portal
// de parceiros com uma URL própria (?topico=...). app/uninstalled é registrado pela API e traz "event".
export type WebhookTopic = "app/uninstalled" | "app/store_redact" | "customer/redact" | "customers/data_request";

const TOPICS: WebhookTopic[] = ["app/uninstalled", "app/store_redact", "customer/redact", "customers/data_request"];

export function webhookTopic(query: string | null, body: { event?: unknown }): WebhookTopic | null {
  const candidate = typeof body.event === "string" ? body.event : query;
  return TOPICS.find((t) => t === candidate) ?? null;
}

export class NuvemshopError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryable: boolean,
    readonly body?: unknown,
  ) {
    super(message);
  }
}

export interface ClientOptions {
  storeId: string;
  accessToken: string;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  maxRetries?: number;
}

export class NuvemshopClient {
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly maxRetries: number;

  constructor(private readonly opts: ClientOptions) {
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.sleep = opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
    this.maxRetries = opts.maxRetries ?? 5;
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${API_BASE}/${API_VERSION}/${this.opts.storeId}${path}`;
    for (let attempt = 0; ; attempt++) {
      let res: Response;
      try {
        res = await this.fetchImpl(url, {
          method,
          headers: {
            Authorization: `Bearer ${this.opts.accessToken}`,
            "User-Agent": `${process.env.NUVEMSHOP_APP_NAME ?? "LoteOn"} (${process.env.NUVEMSHOP_CONTACT_EMAIL ?? "suporte@exemplo.com"})`,
            ...(body ? { "Content-Type": "application/json; charset=utf-8" } : {}),
          },
          body: body ? JSON.stringify(body) : undefined,
        });
      } catch (e) {
        // Erro de rede: a requisição pode ter chegado. Quem chama deve reconciliar antes de recriar.
        throw new NuvemshopError(`Erro de rede: ${(e as Error).message}`, 0, true);
      }

      if (res.status === 429 && attempt < this.maxRetries) {
        // Espera o balde esvaziar (x-rate-limit-reset em ms) com recuo progressivo como piso.
        const reset = Number(res.headers.get("x-rate-limit-reset"));
        const backoff = 500 * 2 ** attempt;
        await this.sleep(Number.isFinite(reset) && reset > 0 ? Math.max(reset, backoff) : backoff);
        continue;
      }

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok) {
        const retryable = res.status === 429 || res.status >= 500;
        throw new NuvemshopError(`Nuvemshop respondeu ${res.status}: ${text.slice(0, 300)}`, res.status, retryable, data);
      }
      return data as T;
    }
  }

  getStore() {
    return this.request<{ id: number; name: Record<string, string>; main_language?: string }>("GET", "/store");
  }

  // Sem este webhook, uma loja que desinstala o app continuaria "conectada" com um token inválido.
  registerWebhook(event: "app/uninstalled", url: string) {
    return this.request<{ id: number }>("POST", "/webhooks", { event, url });
  }

  createProduct(payload: NuvemshopProductPayload) {
    return this.request<{ id: number; handle?: Record<string, string> }>("POST", "/products", payload);
  }

  // Usado na reconciliação: o produto pode ter sido criado mesmo que a resposta tenha se perdido.
  async findProductBySku(sku: string): Promise<{ id: number } | null> {
    try {
      return await this.request<{ id: number }>("GET", `/products/sku/${encodeURIComponent(sku)}`);
    } catch (e) {
      if (e instanceof NuvemshopError && e.status === 404) return null;
      throw e;
    }
  }
}

// ---------- Conversão do catálogo para o formato da API ----------

type I18n = Record<string, string>;

export interface NuvemshopProductPayload {
  name: I18n;
  description: I18n;
  brand?: string;
  published: boolean;
  attributes?: I18n[];
  images: { src: string; position: number }[];
  variants: { sku: string; price?: string; stock?: string | number; barcode?: string; values?: I18n[] }[];
  categories?: number[];
}

export interface ProductForExport {
  name: string;
  description: string;
  brand: string | null;
  images: { url: string }[];
  variants: { sku: string; options: Record<string, string>; gtin: string | null }[];
}

export interface ExportSettings {
  language: string; // idioma principal da loja, ex.: "pt"
  publish: boolean; // false = criar oculto para revisão (recomendado)
  priceCents: number | null; // preço de venda definido pelo lojista
  stock: number | null; // null = estoque ilimitado; o padrão é 0 para nunca presumir disponibilidade
}

const MAX_ATTRIBUTES = 3;
const MAX_IMAGES_ON_CREATE = 9;

export function toNuvemshopPayload(p: ProductForExport, s: ExportSettings): NuvemshopProductPayload {
  const t = (text: string): I18n => ({ [s.language]: text });
  const attributeNames = [...new Set(p.variants.flatMap((v) => Object.keys(v.options)))];
  if (attributeNames.length > MAX_ATTRIBUTES) {
    throw new Error(`A Nuvemshop aceita no máximo ${MAX_ATTRIBUTES} atributos de variante por produto`);
  }
  if (p.images.length === 0) throw new Error("Produto sem imagem");

  const price = s.priceCents === null ? undefined : (s.priceCents / 100).toFixed(2);
  return {
    name: t(p.name),
    description: t(p.description),
    ...(p.brand ? { brand: p.brand } : {}),
    published: s.publish,
    ...(attributeNames.length ? { attributes: attributeNames.map(t) } : {}),
    images: p.images.slice(0, MAX_IMAGES_ON_CREATE).map((img, i) => ({ src: img.url, position: i + 1 })),
    variants: p.variants.map((v) => ({
      sku: v.sku,
      ...(price ? { price } : {}),
      stock: s.stock ?? "", // "" é estoque ilimitado na API
      ...(v.gtin ? { barcode: v.gtin } : {}),
      ...(attributeNames.length ? { values: attributeNames.map((a) => t(v.options[a] ?? "-")) } : {}),
    })),
  };
}
