import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const LABELS = { DRAFT: "Rascunho", IN_REVIEW: "Em revisão", APPROVED: "Aprovados", UNAVAILABLE: "Indisponíveis" };

export default async function AdminHome() {
  const [byStatus, stores, orders] = await Promise.all([
    prisma.catalogProduct.groupBy({ by: ["status"], _count: true }),
    prisma.store.count({ where: { status: "CONNECTED" } }),
    prisma.order.count({ where: { status: "PAID" } }),
  ]);
  const count = (s: keyof typeof LABELS) => byStatus.find((b) => b.status === s)?._count ?? 0;

  return (
    <div className="stack">
      <h1>Visão geral</h1>
      <div className="grid">
        {(Object.keys(LABELS) as (keyof typeof LABELS)[]).map((s) => (
          <div key={s} className="card">
            <div className="muted small">{LABELS[s]}</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{count(s)}</div>
          </div>
        ))}
        <div className="card">
          <div className="muted small">Lojas conectadas</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{stores}</div>
        </div>
        <div className="card">
          <div className="muted small">Pedidos pagos</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{orders}</div>
        </div>
      </div>
    </div>
  );
}
