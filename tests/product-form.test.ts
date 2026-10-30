import { describe, expect, it } from "vitest";
import { imagesToText, parseProductForm, variantsToText } from "@/lib/product-form";

const valid = {
  code: "cat-bea-000142",
  name: "Batom líquido matte",
  description: "Batom de longa duração com acabamento matte.",
  brand: "Marca X",
  categoryId: "cat1",
  suggestedPrice: "39,90",
  supplierPrice: "99,90",
  variants: "B142-1 ; Cor:01 Nude\nB142-2 ; Cor:02 Rosé|Volume:4ml ; 7891234567895",
  images: "https://img/a.jpg ; própria ; estúdio",
};

describe("parseProductForm", () => {
  it("normaliza código, preço, variantes e imagens", () => {
    const r = parseProductForm(valid);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.code).toBe("CAT-BEA-000142");
    expect(r.data.suggestedPrice).toBe(39.9);
    expect(r.data.supplierPrice).toBe(99.9);
    expect(r.data.variants[1]).toEqual({ sku: "B142-2", options: { Cor: "02 Rosé", Volume: "4ml" }, gtin: "7891234567895" });
    expect(r.data.images[0]).toMatchObject({ license: "própria", source: "estúdio" });
  });

  it("exige licença e origem nas imagens", () => {
    const r = parseProductForm({ ...valid, images: "https://img/a.jpg" });
    expect(r).toEqual({ ok: false, error: "Imagem 1: informe licença e origem" });
  });

  it("recusa SKU repetido", () => {
    const r = parseProductForm({ ...valid, variants: "A\nA" });
    expect(r.ok).toBe(false);
  });

  it("ida e volta do texto das variantes e imagens", () => {
    const r = parseProductForm(valid);
    if (!r.ok) throw new Error(r.error);
    expect(parseProductForm({ ...valid, variants: variantsToText(r.data.variants), images: imagesToText(r.data.images) })).toEqual(r);
  });
});
