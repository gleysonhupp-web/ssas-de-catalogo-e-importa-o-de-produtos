import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

// Loja de destino atual da conta: a conexão ativa mais recente.
export async function activeStore(accountId: string) {
  return prisma.store.findFirst({
    where: { accountId, status: "CONNECTED" },
    orderBy: { connectedAt: "desc" },
  });
}

// Produtos já comprados para a loja (concluídos, em andamento ou com reprocessamento grátis disponível):
// nunca são cobrados de novo. Mesma regra de billableCartProducts.
export async function importedProductIds(storeId: string | undefined): Promise<Set<string>> {
  if (!storeId) return new Set();
  const rows = await prisma.importItem.findMany({
    where: { storeId },
    select: { catalogProductId: true },
  });
  return new Set(rows.map((r) => r.catalogProductId));
}

// Uma categoria e todas as suas descendentes, para filtrar "Beleza" incluindo "Batom".
export async function categorySubtree(slug: string): Promise<string[]> {
  const all = await prisma.catalogCategory.findMany({ select: { id: true, slug: true, parentId: true } });
  const root = all.find((c) => c.slug === slug);
  if (!root) return [];
  const ids = [root.id];
  for (let i = 0; i < ids.length; i++) {
    for (const c of all) if (c.parentId === ids[i]) ids.push(c.id);
  }
  return ids;
}

export interface CartLine {
  productId: string;
  code: string;
  name: string;
  brand: string | null;
  image: string | null;
  variants: number;
  supplierPriceCents: number | null; // preço no fornecedor (referência)
  suggestedPriceCents: number | null;
  resalePriceCents: number | null; // preço de venda escolhido pelo lojista
  problem: "unavailable" | "already_imported" | null;
}

export async function cartLines(accountId: string, storeId?: string): Promise<CartLine[]> {
  const [items, imported] = await Promise.all([
    prisma.cartItem.findMany({
      where: { accountId },
      orderBy: { addedAt: "asc" },
      include: {
        product: {
          include: { media: { orderBy: { position: "asc" }, take: 1 }, _count: { select: { variants: true } } },
        },
      },
    }),
    importedProductIds(storeId),
  ]);
  return items.map(({ product: p, resalePriceCents }) => ({
    productId: p.id,
    code: p.code,
    name: p.name,
    brand: p.brand,
    image: p.media[0]?.url ?? null,
    variants: p._count.variants,
    supplierPriceCents: decimalToCents(p.supplierPrice),
    suggestedPriceCents: decimalToCents(p.suggestedPrice),
    resalePriceCents,
    problem: p.status !== "APPROVED" ? "unavailable" : imported.has(p.id) ? "already_imported" : null,
  }));
}

export function decimalToCents(d: Prisma.Decimal | null): number | null {
  return d === null ? null : Math.round(Number(d) * 100);
}

export const APPROVED_ONLY: Prisma.CatalogProductWhereInput = { status: "APPROVED" };
