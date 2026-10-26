import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhook } from "@/lib/nuvemshop";

// Webhooks da Nuvemshop: desinstalação do app e pedidos de LGPD (obrigatórios para publicar o app).
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhook(raw, req.headers.get("x-linkedstore-hmac-sha256"))) {
    return NextResponse.json({ error: "assinatura inválida" }, { status: 401 });
  }
  const body = JSON.parse(raw) as { store_id?: number; event?: string };
  const externalStoreId = String(body.store_id ?? "");

  switch (body.event) {
    case "app/uninstalled":
    case "store/redact":
      // Revoga e apaga o token; o histórico de importações é mantido para auditoria.
      await prisma.store.updateMany({
        where: { platform: "nuvemshop", externalStoreId },
        data: { status: "REVOKED", revokedAt: new Date(), accessTokenEnc: "" },
      });
      break;
    case "customers/redact":
    case "customers/data_request":
      // O serviço não guarda dados de clientes finais da loja: nada a apagar ou exportar.
      break;
  }
  await prisma.auditLog.create({
    data: { event: `nuvemshop.${body.event ?? "desconhecido"}`, entity: "Store", entityId: externalStoreId },
  });
  return NextResponse.json({ ok: true });
}
