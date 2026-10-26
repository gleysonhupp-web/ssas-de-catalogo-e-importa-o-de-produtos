import "server-only";
import type { EditorialStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { ParsedProduct } from "@/lib/catalog-csv";

// Transições editoriais permitidas (capítulo 6): rascunho → revisão → aprovado / indisponível.
const TRANSITIONS: Record<EditorialStatus, EditorialStatus[]> = {
  DRAFT: ["IN_REVIEW", "UNAVAILABLE"],
  IN_REVIEW: ["APPROVED", "DRAFT", "UNAVAILABLE"],
  APPROVED: ["UNAVAILABLE", "IN_REVIEW"],
  UNAVAILABLE: ["DRAFT", "IN_REVIEW"],
};

export function canTransition(from: EditorialStatus, to: EditorialStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export async function audit(
  tx: Prisma.TransactionClient,
  data: { actorId: string; event: string; entity: string; entityId: string; before?: unknown; after?: unknown },
) {
  await tx.auditLog.create({
    data: {
      ...data,
      before: data.before === undefined ? undefined : (data.before as Prisma.InputJsonValue),
      after: data.after === undefined ? undefined : (data.after as Prisma.InputJsonValue),
    },
  });
}

export async function changeStatus(productId: string, to: EditorialStatus, actorId: string) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.catalogProduct.findUniqueOrThrow({ where: { id: productId } });
    if (!canTransition(product.status, to)) {
      throw new Error(`Não é possível mudar de ${product.status} para ${to}`);
    }
    if (to === "APPROVED") {
      const [images, unlicensed] = await Promise.all([
        tx.mediaAsset.count({ where: { catalogProductId: productId } }),
        tx.mediaAsset.count({ where: { catalogProductId: productId, license: "" } }),
      ]);
      if (images === 0) throw new Error("Produto sem imagem não pode ser aprovado");
      if (unlicensed > 0) throw new Error("Há imagens sem licença registrada");
    }
    await tx.catalogProduct.update({ where: { id: productId }, data: { status: to, updatedBy: actorId } });
    await audit(tx, {
      actorId,
      event: "catalog.status",
      entity: "CatalogProduct",
      entityId: productId,
      before: { status: product.status },
      after: { status: to },
    });
  });
}

export interface ProductInput {
  code: string;
  name: string;
  description: string;
  brand?: string;
  categoryId: string;
  suggestedPrice?: number;
  regulatoryNotes?: string;
  images: { url: string; license: string; source: string; altText?: string }[];
  variants: { sku: string; options: Record<string, string>; gtin?: string }[];
}

// Editar um produto aprovado gera nova versão e o devolve para revisão.
// Importações antigas continuam apontando para a versão que foi enviada.
export async function saveProduct(id: string | null, input: ProductInput, actorId: string) {
  return prisma.$transaction(async (tx) => {
    const before = id
      ? await tx.catalogProduct.findUniqueOrThrow({ where: { id }, include: { variants: true, media: true } })
      : null;
    const bumpVersion = before?.status === "APPROVED";

    const data = {
      code: input.code,
      name: input.name,
      description: input.description,
      brand: input.brand || null,
      categoryId: input.categoryId,
      suggestedPrice: input.suggestedPrice ?? null,
      regulatoryNotes: input.regulatoryNotes || null,
      updatedBy: actorId,
    };

    const product = before
      ? await tx.catalogProduct.update({
          where: { id: before.id },
          data: {
            ...data,
            ...(bumpVersion ? { version: { increment: 1 }, status: "IN_REVIEW" as const } : {}),
          },
        })
      : await tx.catalogProduct.create({ data });

    await tx.mediaAsset.deleteMany({ where: { catalogProductId: product.id } });
    await tx.mediaAsset.createMany({
      data: input.images.map((img, position) => ({ ...img, position, catalogProductId: product.id })),
    });
    await tx.catalogVariant.deleteMany({ where: { catalogProductId: product.id } });
    await tx.catalogVariant.createMany({
      data: input.variants.map((v) => ({ ...v, catalogProductId: product.id })),
    });

    await audit(tx, {
      actorId,
      event: before ? "catalog.update" : "catalog.create",
      entity: "CatalogProduct",
      entityId: product.id,
      before: before ?? undefined,
      after: input,
    });
    return product;
  });
}

// Lote interno: cria produtos novos como rascunho; códigos já existentes são ignorados
// para nunca sobrescrever silenciosamente um produto revisado.
export async function importParsedProducts(products: ParsedProduct[], actorId: string) {
  const categories = await prisma.catalogCategory.findMany({ select: { id: true, slug: true } });
  const bySlug = new Map(categories.map((c) => [c.slug, c.id]));
  const existing = new Set(
    (
      await prisma.catalogProduct.findMany({
        where: { code: { in: products.map((p) => p.code) } },
        select: { code: true },
      })
    ).map((p) => p.code),
  );

  let created = 0;
  const skipped: string[] = [];
  for (const p of products) {
    if (existing.has(p.code)) {
      skipped.push(p.code);
      continue;
    }
    await saveProduct(
      null,
      {
        code: p.code,
        name: p.name,
        description: p.description,
        brand: p.brand,
        categoryId: bySlug.get(p.categorySlug)!,
        suggestedPrice: p.suggestedPrice,
        images: p.images.map((url) => ({ url, license: p.license, source: p.source, altText: p.name })),
        variants: p.variants,
      },
      actorId,
    );
    created++;
  }
  return { created, skipped };
}
