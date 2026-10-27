import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/pricing";
import { ORDER_LABEL } from "./labels";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await prisma.order.findMany({
    where: { accountId: user.accountId, status: { not: "DRAFT" } },
    include: { batch: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <main className="container stack" style={{ maxWidth: 820 }}>
      <h1>Minhas importações</h1>
      {orders.length === 0 && <p className="muted">Nenhum pedido ainda. <Link href="/catalogo">Explorar o catálogo</Link></p>}
      <div className="card table-wrap" style={{ padding: 0 }}>
        <table className="table">
          <thead><tr><th>Data</th><th>Produtos</th><th>Total</th><th>Situação</th><th>Importados</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><Link href={`/pedidos/${o.id}`}>{o.createdAt.toLocaleString("pt-BR")}</Link></td>
                <td>{o.quantity}</td>
                <td>{formatBRL(o.totalCents)}</td>
                <td>{ORDER_LABEL[o.status]}</td>
                <td>{o.batch ? `${o.batch.succeeded}/${o.batch.total}` : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
