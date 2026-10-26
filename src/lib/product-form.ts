// Converte o formulário de produto do admin em dados validados.
// Variantes, uma por linha: "SKU ; Cor:05|Volume:4ml ; GTIN (opcional)"
// Imagens, uma por linha:  "URL ; licença ; origem"

import { z } from "zod";

const CODE_RE = /^CAT-[A-Z]{3}-\d{6}$/;

const base = z.object({
  code: z.string().trim().toUpperCase().regex(CODE_RE, "Código fora do padrão CAT-XXX-000000"),
  name: z.string().trim().min(3, "Nome muito curto"),
  description: z.string().trim().min(10, "Descrição muito curta"),
  brand: z.string().trim().optional(),
  categoryId: z.string().min(1, "Escolha uma categoria"),
  suggestedPrice: z
    .string()
    .trim()
    .transform((v) => (v ? Number(v.replace(",", ".")) : undefined))
    .refine((v) => v === undefined || (Number.isFinite(v) && v >= 0), "Preço sugerido inválido"),
  regulatoryNotes: z.string().trim().optional(),
});

export type ParsedForm =
  | { ok: true; data: z.infer<typeof base> & { variants: Variant[]; images: Image[] } }
  | { ok: false; error: string };

type Variant = { sku: string; options: Record<string, string>; gtin?: string };
type Image = { url: string; license: string; source: string; altText?: string };

function lines(raw: string): string[] {
  return raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

export function parseProductForm(form: Record<string, string>): ParsedForm {
  const parsed = base.safeParse(form);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const variants: Variant[] = [];
  for (const [i, line] of lines(form.variants ?? "").entries()) {
    const [sku, opts = "", gtin = ""] = line.split(";").map((s) => s.trim());
    if (!sku) return { ok: false, error: `Variante ${i + 1}: SKU vazio` };
    const options: Record<string, string> = {};
    for (const pair of opts.split("|").filter(Boolean)) {
      const idx = pair.indexOf(":");
      if (idx <= 0) return { ok: false, error: `Variante ${i + 1}: opção "${pair}" deve ser Nome:Valor` };
      options[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
    }
    variants.push({ sku, options, gtin: gtin || undefined });
  }
  if (variants.length === 0) return { ok: false, error: "Informe pelo menos uma variante (SKU)" };
  if (new Set(variants.map((v) => v.sku)).size !== variants.length) {
    return { ok: false, error: "Há SKUs repetidos nas variantes" };
  }

  const images: Image[] = [];
  for (const [i, line] of lines(form.images ?? "").entries()) {
    const [url, license = "", source = ""] = line.split(";").map((s) => s.trim());
    if (!/^https?:\/\//.test(url)) return { ok: false, error: `Imagem ${i + 1}: URL inválida` };
    if (!license || !source) return { ok: false, error: `Imagem ${i + 1}: informe licença e origem` };
    images.push({ url, license, source, altText: parsed.data.name });
  }

  return { ok: true, data: { ...parsed.data, variants, images } };
}

export function variantsToText(variants: Variant[]): string {
  return variants
    .map((v) =>
      [v.sku, Object.entries(v.options).map(([k, val]) => `${k}:${val}`).join("|"), v.gtin ?? ""]
        .join(" ; ")
        .replace(/ ; $/, ""),
    )
    .join("\n");
}

export function imagesToText(images: Pick<Image, "url" | "license" | "source">[]): string {
  return images.map((m) => [m.url, m.license, m.source].join(" ; ")).join("\n");
}
