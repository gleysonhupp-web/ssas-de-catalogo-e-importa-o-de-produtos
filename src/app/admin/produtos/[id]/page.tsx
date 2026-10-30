import { notFound } from "next/navigation";
import type { EditorialStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { imagesToText, variantsToText } from "@/lib/product-form";
import { ProductForm } from "../ProductForm";
import { STATUS_LABEL, StatusBadge } from "../StatusBadge";
import { changeStatusAction, saveProductAction } from "../actions";
import { categoryOptions } from "../categories";

export const dynamic = "force-dynamic";

const NEXT_STEPS: Record<EditorialStatus, EditorialStatus[]> = {
  DRAFT: ["IN_REVIEW", "UNAVAILABLE"],
  IN_REVIEW: ["APPROVED", "DRAFT", "UNAVAILABLE"],
  APPROVED: ["UNAVAILABLE"],
  UNAVAILABLE: ["DRAFT"],
};

export default async function EditProduct({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string; salvo?: string }>;
}) {
  const { id } = await params;
  const { erro, salvo } = await searchParams;
  const product = await prisma.catalogProduct.findUnique({
    where: { id },
    include: { variants: true, media: { orderBy: { position: "asc" } } },
  });
  if (!product) notFound();

  const history = await prisma.auditLog.findMany({
    where: { entity: "CatalogProduct", entityId: id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="stack">
      <div className="row">
        <h1 style={{ marginRight: "auto" }}>{product.code}</h1>
        <StatusBadge status={product.status} />
        <span className="muted small">versão {product.version}</span>
      </div>
      {erro && <p className="alert">{erro}</p>}
      {salvo && <p className="notice">Produto salvo.</p>}
      {product.status === "APPROVED" && (
        <p className="muted small">Este produto está aprovado. Salvar alterações cria a versão {product.version + 1} e o devolve para revisão.</p>
      )}
      <div className="row">
        {NEXT_STEPS[product.status].map((to) => (
          <form key={to} action={changeStatusAction.bind(null, product.id, to)}>
            <button className={`btn ${to === "APPROVED" ? "btn-primary" : ""}`} type="submit">
              Mover para: {STATUS_LABEL[to]}
            </button>
          </form>
        ))}
      </div>
      {product.media[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.media[0].url} alt={product.media[0].altText ?? ""} style={{ width: 160, borderRadius: 8 }} />
      )}
      <ProductForm
        action={saveProductAction.bind(null, product.id)}
        categories={await categoryOptions()}
        initial={{
          code: product.code,
          name: product.name,
          description: product.description,
          brand: product.brand ?? "",
          categoryId: product.categoryId,
          suggestedPrice: product.suggestedPrice?.toString() ?? "",
          supplierPrice: product.supplierPrice?.toString() ?? "",
          regulatoryNotes: product.regulatoryNotes ?? "",
          variants: variantsToText(
            product.variants.map((v) => ({ sku: v.sku, options: v.options as Record<string, string>, gtin: v.gtin ?? undefined })),
          ),
          images: imagesToText(product.media),
        }}
      />
      <div className="card stack small">
        <strong>Histórico</strong>
        {history.map((h) => (
          <div key={h.id} className="muted">
            {h.createdAt.toLocaleString("pt-BR")} · {h.event}
            {h.event === "catalog.status" && ` → ${(h.after as { status: EditorialStatus }).status}`}
          </div>
        ))}
      </div>
    </div>
  );
}
