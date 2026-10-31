import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { activeStore, decimalToCents, importedProductIds } from "@/lib/merchant";
import { formatBRL } from "@/lib/pricing";
import { addToCart, removeFromCart } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, user] = await Promise.all([
    prisma.catalogProduct.findFirst({
      where: { id, status: "APPROVED" },
      include: { category: true, variants: true, media: { orderBy: { position: "asc" } } },
    }),
    currentUser(),
  ]);
  if (!product) notFound();

  const store = user ? await activeStore(user.accountId) : null;
  const [importedIds, cartItem] = await Promise.all([
    importedProductIds(store?.id),
    user
      ? prisma.cartItem.findUnique({
          where: { accountId_catalogProductId: { accountId: user.accountId, catalogProductId: product.id } },
        })
      : null,
  ]);
  const already = importedIds.has(product.id);
  const selected = !!cartItem;

  return (
    <main className="container stack">
      <Link href="/catalogo" className="small">← Voltar ao catálogo</Link>
      <div className="row" style={{ alignItems: "flex-start", gap: 24 }}>
        <div className="stack" style={{ flex: "1 1 280px", maxWidth: 420 }}>
          {product.media.map((m) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img loading="lazy" decoding="async" key={m.id} src={m.url} alt={m.altText ?? product.name} style={{ borderRadius: 8 }} />
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
          {product.supplierPrice !== null && (
            <p className="small">
              Preço no fornecedor (referência): <strong>{formatBRL(decimalToCents(product.supplierPrice)!)}</strong>
            </p>
          )}
          <p className="muted small">
            O anúncio é criado com nome, descrição, fotos, variantes e o preço de venda que você definir no carrinho,
            antes da importação. O estoque fica por sua conta; este serviço não fornece a mercadoria.
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
