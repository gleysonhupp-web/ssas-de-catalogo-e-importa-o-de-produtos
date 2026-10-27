import Link from "next/link";
import type { EditorialStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { STATUS_LABEL, StatusBadge } from "./StatusBadge";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AdminProducts({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { q = "", status = "", page = "1" } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);
  const where: Prisma.CatalogProductWhereInput = {
    ...(status ? { status: status as EditorialStatus } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { code: { contains: q, mode: "insensitive" } },
            { brand: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [products, total] = await Promise.all([
    prisma.catalogProduct.findMany({
      where,
      include: { category: true, _count: { select: { variants: true, media: true } } },
      orderBy: { updatedAt: "desc" },
      take: PAGE_SIZE,
      skip: (pageNum - 1) * PAGE_SIZE,
    }),
    prisma.catalogProduct.count({ where }),
  ]);

  return (
    <div className="stack">
      <div className="row">
        <h1 style={{ marginRight: "auto" }}>Produtos ({total})</h1>
        <Link href="/admin/produtos/importar" className="btn">Importar CSV</Link>
        <Link href="/admin/produtos/novo" className="btn btn-primary">Novo produto</Link>
      </div>
      <form className="row">
        <input name="q" defaultValue={q} placeholder="Buscar por nome, código ou marca" style={{ flex: 1, minWidth: 200 }} />
        <select name="status" defaultValue={status}>
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button className="btn" type="submit">Filtrar</button>
      </form>
      <div className="table-wrap card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Código</th><th>Nome</th><th>Categoria</th><th>Variantes</th><th>Fotos</th><th>Versão</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td><Link href={`/admin/produtos/${p.id}`}>{p.code}</Link></td>
                <td>{p.name}</td>
                <td>{p.category.name}</td>
                <td>{p._count.variants}</td>
                <td>{p._count.media}</td>
                <td>v{p.version}</td>
                <td><StatusBadge status={p.status} /></td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={7} className="muted">Nenhum produto encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {total > PAGE_SIZE && (
        <div className="row small">
          {pageNum > 1 && <Link href={`?q=${q}&status=${status}&page=${pageNum - 1}`}>← Anterior</Link>}
          <span className="muted">Página {pageNum} de {Math.ceil(total / PAGE_SIZE)}</span>
          {pageNum * PAGE_SIZE < total && <Link href={`?q=${q}&status=${status}&page=${pageNum + 1}`}>Próxima →</Link>}
        </div>
      )}
    </div>
  );
}
