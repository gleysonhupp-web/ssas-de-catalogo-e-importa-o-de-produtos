import { describe, expect, it } from "vitest";
import { formatBRL, markupPercent, parseBRLToCents, quote, TIERED_POLICY } from "@/lib/pricing";

describe("quote", () => {
  it("cobra 50 × R$ 1,25 = R$ 62,50 no preço fixo", () => {
    expect(quote(50, { kind: "fixed", unitPriceCents: 125 })).toEqual({
      quantity: 50,
      unitPriceCents: 125,
      totalCents: 6250,
    });
  });

  it("aplica a faixa progressiva certa", () => {
    expect(quote(49, TIERED_POLICY).unitPriceCents).toBe(125);
    expect(quote(50, TIERED_POLICY).unitPriceCents).toBe(110);
    expect(quote(200, TIERED_POLICY).unitPriceCents).toBe(95);
    expect(quote(1000, TIERED_POLICY).totalCents).toBe(80000);
  });

  it("rejeita quantidade inválida", () => {
    expect(() => quote(-1)).toThrow();
    expect(() => quote(1.5)).toThrow();
  });

  it("formata em reais", () => {
    expect(formatBRL(6250).replace(/\s/g, " ")).toBe("R$ 62,50");
  });
});

describe("parseBRLToCents", () => {
  it("aceita os formatos que o lojista digita", () => {
    expect(parseBRLToCents("399,90")).toBe(39990);
    expect(parseBRLToCents("399.90")).toBe(39990);
    expect(parseBRLToCents("R$ 1.299,90")).toBe(129990);
    expect(parseBRLToCents("1.299")).toBe(129900);
    expect(parseBRLToCents("99")).toBe(9900);
  });

  it("campo vazio volta para a regra geral", () => {
    expect(parseBRLToCents("  ")).toBeNull();
  });

  it("rejeita valor inválido, zero, negativo ou absurdo", () => {
    for (const v of ["abc", "0", "0,00", "-10", "12,345", "1,2,3", "99999999,00"]) {
      expect(parseBRLToCents(v)).toBeUndefined();
    }
  });
});

describe("markupPercent", () => {
  it("calcula a margem sobre o preço no fornecedor do exemplo", () => {
    expect(markupPercent(39990, 9990)).toBe(300);
    expect(markupPercent(8000, 10000)).toBe(-20);
    expect(markupPercent(null, 9990)).toBeNull();
    expect(markupPercent(39990, null)).toBeNull();
  });
});
