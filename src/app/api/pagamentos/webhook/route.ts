import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { applyProviderPayment } from "@/lib/orders";
import { paymentProvider } from "@/lib/payments";
import { enqueueItems } from "@/lib/queue";

// Notificação do provedor. O corpo só diz "algo mudou": o estado real é consultado na API do provedor.
export async function POST(req: Request) {
  const provider = paymentProvider();
  const body = await req.text();
  const paymentId = provider.parseWebhook({ url: req.url, headers: req.headers, body });
  if (!paymentId) return NextResponse.json({ ok: false }, { status: 400 });

  // Registro do evento: reenvios idênticos ficam documentados uma única vez.
  const eventId = req.headers.get("x-request-id") ?? `${paymentId}-${Date.now()}`;
  try {
    await prisma.paymentEvent.create({
      data: { provider: provider.name, eventId, payload: { paymentId, body: body.slice(0, 5000) } },
    });
  } catch (e) {
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
  }

  const payment = await provider.getPayment(paymentId);
  const outcome = await applyProviderPayment(provider.name, payment);
  if (outcome.kind === "released") {
    const items = await prisma.importItem.findMany({ where: { batchId: outcome.batchId }, select: { id: true } });
    await enqueueItems(items.map((i) => i.id));
  }
  return NextResponse.json({ ok: true, outcome: outcome.kind });
}
