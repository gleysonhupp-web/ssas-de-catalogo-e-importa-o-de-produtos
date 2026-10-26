import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { activeStore, APPROVED_ONLY, categorySubtree, importedProductIds } from "@/lib/merchant";
import { addToCart, removeFromCart } from "../actions";
import { CartBar } from "../CartBar";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

type Search = { q?: string; categoria?: string; marca?: string; ver?: string; page?: string };

export default async function Catalog({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const { q = "", categoria = "", marca = "", ver = "" } = sp;
  const page = Math.max(1, Number(sp.page) || 1);

  const user = await currentUser();
  const store = user ? await activeStore(user.accountId) : null;
  const [cart, imported] = await Promise.all([
    user ? prisma.cartItem.findMany({ where: { accountId: user.accountId }, select: { catalogProductId: true } }) : [],
    importedProductIds(store?.id),
  ]);
  const inCart = new Set(cart.map((c) => c.catalogProductId));

  const where: Prisma.CatalogProductWhereInput = {
    ...APPROVED_ONLY,
    ...(categoria ? { categoryId: { in: await categorySubtree(categoria) } } : {}),
    ...(marca ? { brand: marca } : {}),
    ...(q
      ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] }
      : {}),
    ...(ver === "selecionados" ? { id: { in: [...inCart] } } : {}),
    ...(ver === "importados" ? { id: { in: [...imported] } } : {}),
    ...(ver === "novos" ? { id: { notIn: [...imported] } } : {}),
  };

  const [products, total, categories, brands] = await Promise.all([
    prisma.catalogProduct.findMany({
      where,
      include: { media: { orderBy: { position: "asc" }, take: 1 }, variants: { select: { options: true } } },
      orderBy: { name: "asc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.catalogProduct.count({ where }),
    prisma.catalogCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.catalogProduct.findMany({
      where: { ...APPROVED_ONLY, brand: { not: null } },
      distinct: ["brand"],
      select: { brand: true },
      orderBy: { brand: "asc" },
    }),
  ]);

  const qs = (extra: Partial<Search>) =>
    "?" + new URLSearchParams(Object.entries({ q, categoria, marca, ver, ...extra }).filter(([, v]) => v) as [string, string][]);

  return (
    <main className="container stack">
      <h1>Catálogo</h1>
      <form className="row">
        <input name="q" defaultValue={q} placeholder="Buscar produtos" style={{ flex: 1, minWidth: 180 }} />
        <select name="categoria" defaultValue={categoria}>
          <option value="">Todas as categorias</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
        <select name="marca" defaultValue={marca}>
          <option value="">Todas as marcas</option>
          {brands.map((b) => <option key={b.brand} value={b.brand!}>{b.brand}</option>)}
        </select>
        <select name="ver" defaultValue={ver}>
          <option value="">Todos</option>
          <option value="selecionados">Selecionados</option>
          {store && <option value="novos">Ainda não importados</option>}
          {store && <option value="importados">Já importados</option>}
        </select>
        <button className="btn" type="submit">Filtrar</button>
      </form>
      <p className="muted small">{total} produto(s)</p>

      <div className="grid">
        {products.map((p) => {
          const colors = p.variants.length;
          const already = imported.has(p.id);
          const selected = inCart.has(p.id);
          return (
            <div key={p.id} className="card stack" style={{ gap: 8 }}>
              <Link href={`/catalogo/${p.id}`}>
                {p.media[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.media[0].url} alt={p.media[0].altText ?? p.name} style={{ aspectRatio: "1", objectFit: "cover", borderRadius: 8, width: "100%" }} />
                )}
              </Link>
              <Link href={`/catalogo/${p.id}`} style={{ fontWeight: 600, textDecoration: "none" }}>{p.name}</Link>
              <span className="muted small">
                {p.brand ?? "Sem marca"} · {colors} {colors === 1 ? "variante" : "variantes"}
              </span>
              <span className="badge badge-ok small" title="Fotos e textos com licença de uso comercial registrada">
                Uso comercial autorizado
              </span>
              {already ? (
                <span className="badge badge-warn">Já importado</span>
              ) : selected ? (
                <form action={removeFromCart.bind(null, p.id)}>
                  <button className="btn" type="submit" style={{ width: "100%" }}>✓ Selecionado (remover)</button>
                </form>
              ) : (
                <form action={addToCart.bind(null, p.id)}>
                  <button className="btn btn-primary" type="submit" style={{ width: "100%" }}>Adicionar</button>
                </form>
              )}
            </div>
          );
        })}
      </div>

      {total > PAGE_SIZE && (
        <div className="row small">
          {page > 1 && <Link href={qs({ page: String(page - 1) })}>← Anterior</Link>}
          <span className="muted">Página {page} de {Math.ceil(total / PAGE_SIZE)}</span>
          {page * PAGE_SIZE < total && <Link href={qs({ page: String(page + 1) })}>Próxima →</Link>}
        </div>
      )}

      {user && <CartBar count={inCart.size} />}
    </main>
  );
}
