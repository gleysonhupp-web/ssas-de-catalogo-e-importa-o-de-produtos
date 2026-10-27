import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { activeStore, importedProductIds } from "@/lib/merchant";
import { addToCart, removeFromCart } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.catalogProduct.findFirst({
    where: { id, status: "APPROVED" },
    include: { category: true, variants: true, media: { orderBy: { position: "asc" } } },
  });
  if (!product) notFound();

  const user = await currentUser();
  const store = user ? await activeStore(user.accountId) : null;
  const already = (await importedProductIds(store?.id)).has(product.id);
  const selected = user
    ? !!(await prisma.cartItem.findUnique({
        where: { accountId_catalogProductId: { accountId: user.accountId, catalogProductId: product.id } },
      }))
    : false;

  return (
    <main className="container stack">
      <Link href="/catalogo" className="small">← Voltar ao catálogo</Link>
      <div className="row" style={{ alignItems: "flex-start", gap: 24 }}>
        <div className="stack" style={{ flex: "1 1 280px", maxWidth: 420 }}>
          {product.media.map((m) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={m.id} src={m.url} alt={m.altText ?? product.name} style={{ borderRadius: 8 }} />
          ))}
        </div>
        <div className="stack" style={{ flex: "2 1 320px" }}>
          <span className="muted small">{product.category.name} · {product.code}</span>
          <h1>{product.name}</h1>
          {product.brand && <p className="muted">{product.brand}</p>}
          <p style={{ whiteSpace: "pre-line" }}>{product.description}</p>
          <div className="card stack small">
            <strong>{product.variants.length} variante(s) inclusas no mesmo produto</strong>
            {product.variants.map((v) => (
              <span key={v.id}>
                {Object.entries(v.options as Record<string, string>).map(([k, val]) => `${k}: ${val}`).join(" · ") || "Única"}
              </span>
            ))}
          </div>
          <p className="muted small">
            O anúncio é criado com nome, descrição, fotos e variantes. Preço de venda e estoque ficam por sua conta;
            este serviço não fornece a mercadoria.
          </p>
          {already ? (
            <span className="badge badge-warn">Já importado para sua loja</span>
          ) : selected ? (
            <form action={removeFromCart.bind(null, product.id)}><button className="btn" type="submit">✓ Selecionado (remover)</button></form>
          ) : (
            <form action={addToCart.bind(null, product.id)}><button className="btn btn-primary" type="submit">Adicionar</button></form>
          )}
        </div>
      </div>
    </main>
  );
}
