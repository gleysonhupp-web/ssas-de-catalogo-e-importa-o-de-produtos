import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { activeStore, cartLines } from "@/lib/merchant";
import { formatBRL, quote } from "@/lib/pricing";
import { removeFromCart, removeProblemItems } from "../actions";

export const dynamic = "force-dynamic";

const PROBLEM_LABEL = {
  unavailable: "Indisponível no catálogo",
  already_imported: "Já importado para sua loja, não será cobrado de novo",
};

export default async function CartPage() {
  const user = await requireUser();
  const store = await activeStore(user.accountId);
  const lines = await cartLines(user.accountId, store?.id);
  const billable = lines.filter((l) => !l.problem);
  const problems = lines.filter((l) => l.problem);
  const q = quote(billable.length);
  const variants = billable.reduce((n, l) => n + l.variants, 0);

  return (
    <main className="container stack" style={{ maxWidth: 820 }}>
      <h1>Seu pedido</h1>
      {lines.length === 0 ? (
        <p className="muted">Nenhum produto selecionado. <Link href="/catalogo">Explorar o catálogo</Link></p>
      ) : (
        <>
          <div className="card stack">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span>
                {billable.length} produto(s) · {variants} variante(s) inclusas
              </span>
              <span>{formatBRL(q.unitPriceCents)} por produto</span>
            </div>
            <div className="row" style={{ justifyContent: "space-between", fontSize: 20 }}>
              <strong>Total</strong>
              <strong>{formatBRL(q.totalCents)}</strong>
            </div>
            <p className="muted small">
              Você paga só pelos produtos-base; as variantes (cores, tamanhos) não contam. Sem mensalidade.
              Se a importação de um item falhar, a nova tentativa não é cobrada.
            </p>
          </div>

          {problems.length > 0 && (
            <div className="card stack">
              <strong>Itens que não entram na cobrança ({problems.length})</strong>
              {problems.map((l) => (
                <div key={l.productId} className="row small">
                  <span style={{ flex: 1 }}>{l.name}</span>
                  <span className="badge badge-warn">{PROBLEM_LABEL[l.problem!]}</span>
                </div>
              ))}
              <form action={removeProblemItems.bind(null, problems.map((p) => p.productId))}>
                <button className="btn" type="submit">Remover esses itens</button>
              </form>
            </div>
          )}

          <div className="card table-wrap" style={{ padding: 0 }}>
            <table className="table">
              <tbody>
                {billable.map((l) => (
                  <tr key={l.productId}>
                    <td style={{ width: 56 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {l.image && <img src={l.image} alt="" width={48} height={48} style={{ borderRadius: 6, objectFit: "cover" }} />}
                    </td>
                    <td>
                      <Link href={`/catalogo/${l.productId}`}>{l.name}</Link>
                      <div className="muted small">{l.brand ?? "Sem marca"} · {l.variants} variante(s)</div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <form action={removeFromCart.bind(null, l.productId)}>
                        <button className="btn" type="submit">Remover</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="row" style={{ justifyContent: "flex-end" }}>
            <Link href="/catalogo" className="btn">Continuar escolhendo</Link>
            {store ? (
              <Link href="/checkout" className="btn btn-primary" aria-disabled={billable.length === 0}>
                Continuar para pagamento
              </Link>
            ) : (
              <Link href="/lojas" className="btn btn-primary">Conectar minha loja Nuvemshop</Link>
            )}
          </div>
        </>
      )}
    </main>
  );
}
