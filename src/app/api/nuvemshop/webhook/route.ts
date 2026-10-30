import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhook, webhookTopic } from "@/lib/nuvemshop";

// Webhooks da Nuvemshop: desinstalação do app e pedidos de LGPD (obrigatórios para publicar o app).
// URLs a cadastrar no portal de parceiros (os eventos de LGPD não trazem "event" no corpo):
//   {APP_URL}/api/nuvemshop/webhook?topico=app/store_redact
//   {APP_URL}/api/nuvemshop/webhook?topico=customer/redact
//   {APP_URL}/api/nuvemshop/webhook?topico=customers/data_request
// app/uninstalled é registrado pela API ao conectar a loja (ver /api/nuvemshop/retorno).
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhook(raw, req.headers.get("x-linkedstore-hmac-sha256"))) {
    return NextResponse.json({ error: "assinatura inválida" }, { status: 401 });
  }
  let body: { store_id?: number | string; event?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "corpo inválido" }, { status: 400 });
  }
  const externalStoreId = String(body.store_id ?? "");
  const topic = webhookTopic(new URL(req.url).searchParams.get("topico"), body);

  switch (topic) {
    case "app/uninstalled":
    case "app/store_redact":
      // Revoga e apaga o token; o histórico de importações é mantido para auditoria.
      await prisma.store.updateMany({
        where: { platform: "nuvemshop", externalStoreId },
        data: { status: "REVOKED", revokedAt: new Date(), accessTokenEnc: "" },
      });
      break;
    case "customer/redact":
    case "customers/data_request":
      // O serviço não guarda dados de clientes finais da loja: nada a apagar ou exportar.
      // O pedido fica registrado na auditoria como comprovação do atendimento.
      break;
  }
  await prisma.auditLog.create({
    data: { event: `nuvemshop.${topic ?? "desconhecido"}`, entity: "Store", entityId: externalStoreId },
  });
  return NextResponse.json({ ok: true });
}
