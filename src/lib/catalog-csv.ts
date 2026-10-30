// Importação interna de catálogo por CSV (capítulo 6).
// Uma linha por variante; linhas com o mesmo "codigo" formam um produto.
// Colunas: codigo,nome,descricao,marca,categoria,sku,opcoes,gtin,imagens,licenca,origem,preco_sugerido[,preco_fornecedor]
//   opcoes:  "Cor:05 Nude|Volume:4ml"   imagens: "https://a.jpg|https://b.jpg"

export interface ParsedVariant {
  sku: string;
  options: Record<string, string>;
  gtin?: string;
}

export interface ParsedProduct {
  code: string;
  name: string;
  description: string;
  brand?: string;
  categorySlug: string;
  suggestedPrice?: number;
  supplierPrice?: number;
  images: string[];
  license: string;
  source: string;
  variants: ParsedVariant[];
}

export interface CsvIssue {
  line: number; // linha do arquivo, contando o cabeçalho como 1
  message: string;
}

export interface CsvResult {
  products: ParsedProduct[];
  issues: CsvIssue[];
}

const REQUIRED = ["codigo", "nome", "descricao", "categoria", "sku", "imagens", "licenca", "origem"];
const CODE_RE = /^CAT-[A-Z]{3}-\d{6}$/;

// Excel em português salva com ";"; o separador é detectado pela primeira linha.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  const firstLine = src.split(/\r?\n/, 1)[0];
  const sep = firstLine.split(";").length > firstLine.split(",").length ? ";" : ",";

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === sep) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f.trim() !== ""));
}

function parseOptions(raw: string): Record<string, string> | null {
  if (!raw.trim()) return {};
  const out: Record<string, string> = {};
  for (const pair of raw.split("|")) {
    const idx = pair.indexOf(":");
    if (idx <= 0) return null;
    out[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
  }
  return out;
}

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function parseCatalogCsv(text: string, knownCategorySlugs: Set<string>): CsvResult {
  const rows = parseCsv(text);
  const issues: CsvIssue[] = [];
  if (rows.length < 2) return { products: [], issues: [{ line: 1, message: "Arquivo vazio ou sem linhas de produto" }] };

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const missing = REQUIRED.filter((c) => !header.includes(c));
  if (missing.length) {
    return { products: [], issues: [{ line: 1, message: `Colunas obrigatórias ausentes: ${missing.join(", ")}` }] };
  }
  const col = (r: string[], name: string) => (r[header.indexOf(name)] ?? "").trim();

  const byCode = new Map<string, ParsedProduct>();
  const seenSkus = new Set<string>();

  rows.slice(1).forEach((r, i) => {
    const line = i + 2;
    const code = col(r, "codigo").toUpperCase();
    const errs: string[] = [];

    if (!CODE_RE.test(code)) errs.push(`código "${code}" fora do padrão CAT-XXX-000000`);
    for (const c of REQUIRED) if (!col(r, c)) errs.push(`campo "${c}" vazio`);

    const categorySlug = col(r, "categoria").toLowerCase();
    if (categorySlug && !knownCategorySlugs.has(categorySlug)) errs.push(`categoria "${categorySlug}" não existe`);

    const sku = col(r, "sku");
    if (sku && seenSkus.has(sku)) errs.push(`SKU "${sku}" repetido no arquivo`);

    const options = parseOptions(col(r, "opcoes"));
    if (!options) errs.push(`opções "${col(r, "opcoes")}" em formato inválido (use Nome:Valor|Nome:Valor)`);

    const images = col(r, "imagens").split("|").map((s) => s.trim()).filter(Boolean);
    const badImage = images.find((u) => !isHttpUrl(u));
    if (badImage) errs.push(`URL de imagem inválida: ${badImage}`);

    const priceRaw = col(r, "preco_sugerido").replace(",", ".");
    const suggestedPrice = priceRaw ? Number(priceRaw) : undefined;
    if (suggestedPrice !== undefined && (!Number.isFinite(suggestedPrice) || suggestedPrice < 0)) {
      errs.push(`preço sugerido inválido: ${priceRaw}`);
    }
    const supplierRaw = col(r, "preco_fornecedor").replace(",", ".");
    const supplierPrice = supplierRaw ? Number(supplierRaw) : undefined;
    if (supplierPrice !== undefined && (!Number.isFinite(supplierPrice) || supplierPrice < 0)) {
      errs.push(`preço no fornecedor inválido: ${supplierRaw}`);
    }

    if (errs.length) {
      errs.forEach((message) => issues.push({ line, message }));
      return;
    }
    seenSkus.add(sku);

    const variant: ParsedVariant = { sku, options: options!, gtin: col(r, "gtin") || undefined };
    const existing = byCode.get(code);
    if (existing) {
      if (existing.name !== col(r, "nome")) {
        issues.push({ line, message: `nome diferente do usado antes para ${code}` });
        return;
      }
      existing.variants.push(variant);
      return;
    }
    byCode.set(code, {
      code,
      name: col(r, "nome"),
      description: col(r, "descricao"),
      brand: col(r, "marca") || undefined,
      categorySlug,
      suggestedPrice,
      supplierPrice,
      images,
      license: col(r, "licenca"),
      source: col(r, "origem"),
      variants: [variant],
    });
  });

  return { products: [...byCode.values()], issues };
}
