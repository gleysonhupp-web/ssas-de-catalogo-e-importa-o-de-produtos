import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/pricing";
import { retryBatch } from "../actions";
import { ITEM_LABEL, ORDER_LABEL } from "../labels";
import { AutoRefresh } from "./AutoRefresh";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, accountId: user.accountId },
    include: {
      payments: { orderBy: { createdAt: "desc" } },
      batch: {
        include: {
          store: true,
          items: { include: { product: { select: { name: true, code: true } } }, orderBy: { createdAt: "asc" } },
        },
      },
    },
  });
  if (!order) notFound();
  const batch = order.batch;
  const items = batch?.items ?? [];
  const failed = items.filter((i) => i.status === "FAILED").length;
  const running = items.some((i) => ["RESERVED", "QUEUED", "PROCESSING"].includes(i.status));
  const checkoutUrl = order.payments.find((p) => p.checkoutUrl)?.checkoutUrl;

  return (
    <main className="container stack" style={{ maxWidth: 820 }}>
      {(running || order.status === "PENDING_PAYMENT") && <AutoRefresh />}
      <Link href="/pedidos" className="small">← Minhas importações</Link>
      <h1>Pedido de {order.quantity} produto(s)</h1>
      <div className="card stack">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span>{ORDER_LABEL[order.status]}</span>
          <strong>{formatBRL(order.totalCents)}</strong>
        </div>
        {order.status === "PENDING_PAYMENT" && (
          <p className="small">
            Aguardando a confirmação do pagamento. A importação começa sozinha assim que ele for confirmado.{" "}
            {checkoutUrl && <a href={checkoutUrl}>Abrir o pagamento</a>}
          </p>
        )}
        {batch && order.status === "PAID" && (
          <>
            <div className="small">
              Destino: {batch.store.name ?? batch.store.externalStoreId} · {batch.succeeded} de {batch.total} concluídos
              {failed > 0 && ` · ${failed} com falha`}
            </div>
            <div style={{ height: 8, background: "var(--border)", borderRadius: 4 }}>
              <div style={{ width: `${(100 * batch.succeeded) / batch.total}%`, height: 8, background: "var(--ok)", borderRadius: 4 }} />
            </div>
          </>
        )}
        {failed > 0 && !running && batch && (
          <form action={retryBatch.bind(null, batch.id)}>
            <button className="btn btn-primary" type="submit">Tentar de novo os {failed} itens com falha (sem custo)</button>
          </form>
        )}
      </div>

      {items.length > 0 && (
        <div className="card table-wrap" style={{ padding: 0 }}>
          <table className="table">
            <thead><tr><th>Produto</th><th>Situação</th><th>Detalhe</th></tr></thead>
            <tbody>
              {items.map((i) => {
                const [label, cls] = ITEM_LABEL[i.status];
                return (
                  <tr key={i.id}>
                    <td>{i.product.name}<div className="muted small">{i.product.code}</div></td>
                    <td><span className={`badge ${cls}`}>{label}</span></td>
                    <td className="small">
                      {i.status === "DONE" && i.externalProductId && `ID na Nuvemshop: ${i.externalProductId}`}
                      {i.lastError && i.status !== "DONE" && <span className="muted">{i.lastError}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {batch && !running && batch.succeeded > 0 && (
        <p className="muted small">
          Os produtos foram criados {(batch.settings as { publish?: boolean }).publish ? "visíveis" : "ocultos"} na sua loja.
          Revise preço, estoque e informações de venda no painel da Nuvemshop antes de publicar.
        </p>
      )}
    </main>
  );
}
