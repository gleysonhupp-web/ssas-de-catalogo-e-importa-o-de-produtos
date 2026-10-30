import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { encryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { exchangeCode, NuvemshopClient } from "@/lib/nuvemshop";

// URL de redirecionamento configurada no app da Nuvemshop.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const back = (msg: string) => NextResponse.redirect(new URL(`/lojas?${msg}`, req.url));
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const user = await currentUser();
  if (!user) return NextResponse.redirect(new URL("/entrar", req.url));
  if (!code || !state) return back("erro=Autorização+cancelada+ou+incompleta");

  // O state é consumido de uma vez: não pode ser reutilizado nem servir a outra conta.
  const saved = await prisma.oAuthState.deleteMany({
    where: { state, accountId: user.accountId, expiresAt: { gt: new Date() } },
  });
  if (saved.count !== 1) return back("erro=Sessão+de+autorização+expirada.+Tente+de+novo");

  let token;
  try {
    token = await exchangeCode(code);
  } catch (e) {
    console.error("nuvemshop.oauth", (e as Error).message);
    return back("erro=A+Nuvemshop+recusou+a+autorização");
  }

  const externalStoreId = String(token.user_id);
  const other = await prisma.store.findUnique({
    where: { platform_externalStoreId: { platform: "nuvemshop", externalStoreId } },
  });
  if (other && other.accountId !== user.accountId && other.status === "CONNECTED") {
    return back("erro=Esta+loja+já+está+conectada+a+outra+conta");
  }

  const client = new NuvemshopClient({ storeId: externalStoreId, accessToken: token.access_token });
  let name: string | null = null;
  try {
    const info = await client.getStore();
    name = info.name?.pt ?? Object.values(info.name ?? {})[0] ?? null;
  } catch {
    // O nome é só para exibição; a conexão vale mesmo sem ele.
  }
  try {
    await client.registerWebhook("app/uninstalled", new URL("/api/nuvemshop/webhook", process.env.APP_URL ?? req.url).toString());
  } catch (e) {
    // Reconectar a loja tenta de novo; a importação também detecta token inválido (401).
    console.error("nuvemshop.webhook_register", (e as Error).message);
  }

  const data = {
    accountId: user.accountId,
    name,
    status: "CONNECTED" as const,
    accessTokenEnc: encryptSecret(token.access_token),
    scopes: token.scope,
    connectedAt: new Date(),
    revokedAt: null,
  };
  await prisma.store.upsert({
    where: { platform_externalStoreId: { platform: "nuvemshop", externalStoreId } },
    update: data,
    create: { ...data, platform: "nuvemshop", externalStoreId },
  });
  await prisma.auditLog.create({
    data: { actorId: user.id, event: "store.connected", entity: "Store", entityId: externalStoreId },
  });
  return back("conectada=1");
}
