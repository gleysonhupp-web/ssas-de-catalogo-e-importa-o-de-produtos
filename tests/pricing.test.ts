import { describe, expect, it } from "vitest";
import { formatBRL, quote, TIERED_POLICY } from "@/lib/pricing";

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
