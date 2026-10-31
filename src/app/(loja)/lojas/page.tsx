import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function StoresPage({ searchParams }: { searchParams: Promise<{ erro?: string; conectada?: string }> }) {
  const user = await requireUser();
  const { erro, conectada } = await searchParams;
  const [stores, cart] = await Promise.all([
    prisma.store.findMany({ where: { accountId: user.accountId }, orderBy: { connectedAt: "desc" } }),
    prisma.cartItem.count({ where: { accountId: user.accountId } }),
  ]);

  return (
    <main className="container stack" style={{ maxWidth: 720 }}>
      <h1>Minha loja</h1>
      {erro && <p className="alert">{erro}</p>}
      {conectada && <p className="notice">Loja conectada com sucesso.</p>}
      {stores.map((s) => (
        <div key={s.id} className="card row">
          <div style={{ flex: 1 }}>
            <strong>{s.name ?? `Loja ${s.externalStoreId}`}</strong>
            <div className="muted small">Nuvemshop · ID {s.externalStoreId} · conectada em {s.connectedAt.toLocaleDateString("pt-BR")}</div>
          </div>
          {s.status === "CONNECTED" ? (
            <span className="badge badge-ok">Conectada</span>
          ) : (
            <span className="badge badge-err">Autorização removida</span>
          )}
        </div>
      ))}
      <div className="card stack">
        <p>
          A conexão usa a autorização oficial da Nuvemshop. Você não informa sua senha aqui, e o acesso fica limitado a
          criar e consultar produtos. Você pode remover a autorização a qualquer momento desinstalando o aplicativo na sua loja.
        </p>
        <div className="row">
          <a className="btn btn-primary" href="/api/nuvemshop/conectar">
            {stores.some((s) => s.status === "CONNECTED") ? "Reconectar ou trocar de loja" : "Conectar minha loja Nuvemshop"}
          </a>
          {cart > 0 && stores.some((s) => s.status === "CONNECTED") && (
            <Link className="btn" href="/carrinho">Voltar ao pedido ({cart})</Link>
          )}
        </div>
      </div>
    </main>
  );
}
