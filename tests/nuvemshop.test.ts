import { createHmac } from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { NuvemshopClient, NuvemshopError, toNuvemshopPayload, verifyWebhook, webhookTopic } from "@/lib/nuvemshop";

beforeAll(() => {
  process.env.NUVEMSHOP_CLIENT_SECRET = "segredo";
});

const product = {
  name: "Batom matte",
  description: "Longa duração",
  brand: "Marca X",
  images: [{ url: "https://img/a.jpg" }, { url: "https://img/b.jpg" }],
  variants: [
    { sku: "B-1", options: { Cor: "Nude" }, gtin: "789" },
    { sku: "B-2", options: { Cor: "Rosé" }, gtin: null },
  ],
};

describe("toNuvemshopPayload", () => {
  it("monta o produto com atributos, variantes e imagens, oculto por padrão", () => {
    const p = toNuvemshopPayload(product, { language: "pt", publish: false, priceCents: 4990, stock: 0 });
    expect(p).toMatchObject({
      name: { pt: "Batom matte" },
      published: false,
      brand: "Marca X",
      attributes: [{ pt: "Cor" }],
      images: [{ src: "https://img/a.jpg", position: 1 }, { src: "https://img/b.jpg", position: 2 }],
    });
    expect(p.variants[0]).toEqual({ sku: "B-1", price: "49.90", stock: 0, barcode: "789", values: [{ pt: "Nude" }] });
    expect(p.variants[1]).not.toHaveProperty("barcode");
  });

  it("produto sem opções não envia atributos", () => {
    const p = toNuvemshopPayload({ ...product, variants: [{ sku: "U", options: {}, gtin: null }] }, { language: "pt", publish: true, priceCents: null, stock: null });
    expect(p).not.toHaveProperty("attributes");
    expect(p.variants[0]).toEqual({ sku: "U", stock: "" });
  });

  it("recusa mais de 3 atributos e produto sem imagem", () => {
    const opts = { A: "1", B: "2", C: "3", D: "4" };
    expect(() => toNuvemshopPayload({ ...product, variants: [{ sku: "X", options: opts, gtin: null }] }, { language: "pt", publish: false, priceCents: null, stock: 0 })).toThrow();
    expect(() => toNuvemshopPayload({ ...product, images: [] }, { language: "pt", publish: false, priceCents: null, stock: 0 })).toThrow("sem imagem");
  });
});

describe("NuvemshopClient", () => {
  const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), { status, headers });

  it("espera e reenvia quando recebe 429", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json(429, {}, { "x-rate-limit-reset": "1200" }))
      .mockResolvedValueOnce(json(201, { id: 99 }));
    const sleep = vi.fn().mockResolvedValue(undefined);
    const c = new NuvemshopClient({ storeId: "1", accessToken: "t", fetchImpl, sleep });
    await expect(c.createProduct({} as never)).resolves.toEqual({ id: 99 });
    expect(sleep).toHaveBeenCalledWith(1200);
    const [url, init] = fetchImpl.mock.calls[1];
    expect(url).toBe("https://api.nuvemshop.com.br/2025-03/1/products");
    expect(init.headers.Authorization).toBe("Bearer t");
    expect(init.headers["User-Agent"]).toBeTruthy();
  });

  it("marca 422 como erro definitivo e 500 como retentável", async () => {
    const c422 = new NuvemshopClient({ storeId: "1", accessToken: "t", fetchImpl: vi.fn().mockResolvedValue(json(422, { name: ["can't be blank"] })) });
    await expect(c422.createProduct({} as never)).rejects.toMatchObject({ status: 422, retryable: false });
    const c500 = new NuvemshopClient({ storeId: "1", accessToken: "t", fetchImpl: vi.fn().mockResolvedValue(json(500, {})) });
    await expect(c500.createProduct({} as never)).rejects.toMatchObject({ status: 500, retryable: true });
  });

  it("erro de rede é retentável e exige reconciliação", async () => {
    const c = new NuvemshopClient({ storeId: "1", accessToken: "t", fetchImpl: vi.fn().mockRejectedValue(new Error("timeout")) });
    await expect(c.createProduct({} as never)).rejects.toBeInstanceOf(NuvemshopError);
  });

  it("findProductBySku devolve null quando não existe", async () => {
    const c = new NuvemshopClient({ storeId: "1", accessToken: "t", fetchImpl: vi.fn().mockResolvedValue(json(404, {})) });
    await expect(c.findProductBySku("X")).resolves.toBeNull();
  });
});

describe("verifyWebhook", () => {
  it("aceita assinatura correta e recusa adulterada", () => {
    const body = '{"store_id":1,"event":"app/uninstalled"}';
    const sig = createHmac("sha256", "segredo").update(body).digest("hex");
    expect(verifyWebhook(body, sig)).toBe(true);
    expect(verifyWebhook(body + " ", sig)).toBe(false);
    expect(verifyWebhook(body, null)).toBe(false);
  });
});

describe("webhookTopic", () => {
  it("usa o evento do corpo (app/uninstalled) ou o tópico da URL (LGPD, sem evento no corpo)", () => {
    expect(webhookTopic(null, { event: "app/uninstalled" })).toBe("app/uninstalled");
    expect(webhookTopic("app/store_redact", { store_id: 1 } as { event?: unknown })).toBe("app/store_redact");
    expect(webhookTopic("customers/data_request", {})).toBe("customers/data_request");
  });

  it("ignora tópicos desconhecidos em vez de revogar a loja", () => {
    expect(webhookTopic("store/redact", {})).toBeNull();
    expect(webhookTopic(null, { event: "product/created" })).toBeNull();
    expect(webhookTopic(null, {})).toBeNull();
  });
});
