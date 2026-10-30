// Regras de preço (capítulo 4). Valores sempre em centavos para evitar erro de ponto flutuante.

export type PricingPolicy =
  | { kind: "fixed"; unitPriceCents: number }
  | { kind: "tiered"; tiers: { minQuantity: number; unitPriceCents: number }[] };

// Opção A do documento: R$ 1,25 por produto.
export const DEFAULT_POLICY: PricingPolicy = {
  kind: "fixed",
  unitPriceCents: Number(process.env.UNIT_PRICE_CENTS ?? 125),
};

// Opção B do documento, disponível para teste de preço.
export const TIERED_POLICY: PricingPolicy = {
  kind: "tiered",
  tiers: [
    { minQuantity: 1, unitPriceCents: 125 },
    { minQuantity: 50, unitPriceCents: 110 },
    { minQuantity: 200, unitPriceCents: 95 },
    { minQuantity: 500, unitPriceCents: 80 },
  ],
};

export interface Quote {
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
}

// Variantes não contam: a quantidade é o número de produtos-base (anúncios principais).
export function quote(quantity: number, policy: PricingPolicy = DEFAULT_POLICY): Quote {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new Error(`Quantidade inválida: ${quantity}`);
  }
  const unitPriceCents = unitPriceFor(quantity, policy);
  return { quantity, unitPriceCents, totalCents: quantity * unitPriceCents };
}

function unitPriceFor(quantity: number, policy: PricingPolicy): number {
  if (policy.kind === "fixed") return policy.unitPriceCents;
  const tier = [...policy.tiers]
    .sort((a, b) => b.minQuantity - a.minQuantity)
    .find((t) => quantity >= t.minQuantity);
  return (tier ?? policy.tiers[0]).unitPriceCents;
}

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Preço de revenda digitado pelo lojista: "399,90", "399.90", "1.299,90" ou "R$ 1299". Devolve centavos,
// null para campo vazio e undefined para valor inválido.
export const MAX_RESALE_CENTS = 100_000_000; // R$ 1.000.000,00

export function parseBRLToCents(raw: string): number | null | undefined {
  let v = raw.replace(/R\$|\s/g, "");
  if (!v) return null;
  if (v.includes(",")) v = v.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(v)) v = v.replace(/\./g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(v)) return undefined;
  const cents = Math.round(Number(v) * 100);
  return cents > 0 && cents <= MAX_RESALE_CENTS ? cents : undefined;
}

// Quanto o preço de revenda fica acima do preço no fornecedor, em %. null se não houver os dois.
export function markupPercent(resaleCents: number | null, supplierCents: number | null): number | null {
  if (resaleCents === null || supplierCents === null || supplierCents <= 0) return null;
  return Math.round(((resaleCents - supplierCents) / supplierCents) * 100);
}
