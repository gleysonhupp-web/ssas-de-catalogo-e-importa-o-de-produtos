import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { applyProviderPayment } from "@/lib/orders";
import { canUseFakePayments, paymentProvider } from "@/lib/payments";
import { formatBRL } from "@/lib/pricing";
import { enqueueItems } from "@/lib/queue";

export const dynamic = "force-dynamic";

// Página de pagamento simulado. Só existe quando o Mercado Pago não está configurado.
export default async function FakePayment({ params }: { params: Promise<{ id: string }> }) {
  if (paymentProvider().name !== "fake") notFound();
  const user = await requireUser();
  if (!canUseFakePayments(user.role)) notFound();
  const { id } = await params;
  const order = await prisma.order.findFirst({ where: { id, accountId: user.accountId } });
  if (!order) notFound();

  async function pay(status: "approved" | "rejected") {
    "use server";
    const u = await requireUser();
    if (!canUseFakePayments(u.role)) notFound();
    const o = await prisma.order.findFirstOrThrow({ where: { id, accountId: u.accountId } });
    const outcome = await applyProviderPayment("fake", {
      id: `fake-${o.id}`,
      status,
      amountCents: o.totalCents,
      orderId: o.id,
      method: "pix",
    });
    if (outcome.kind === "released") {
      const items = await prisma.importItem.findMany({ where: { batchId: outcome.batchId }, select: { id: true } });
      await enqueueItems(items.map((i) => i.id));
    }
    redirect(`/pedidos/${o.id}`);
  }

  return (
    <main className="container stack" style={{ maxWidth: 480 }}>
      <h1>Pagamento de teste</h1>
      <p className="alert">Ambiente de testes: nenhum valor é cobrado. Configure o Mercado Pago para cobranças reais.</p>
      <div className="card stack">
        <span>Pedido {order.id}</span>
        <strong style={{ fontSize: 24 }}>{formatBRL(order.totalCents)}</strong>
        <form action={pay.bind(null, "approved")}><button className="btn btn-primary" type="submit">Simular Pix aprovado</button></form>
        <form action={pay.bind(null, "rejected")}><button className="btn" type="submit">Simular pagamento recusado</button></form>
      </div>
    </main>
  );
}
