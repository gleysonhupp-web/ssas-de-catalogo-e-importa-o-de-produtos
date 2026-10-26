import Link from "next/link";
import { formatBRL, quote } from "@/lib/pricing";

// Barra fixa com o total do carrinho, recalculado a cada seleção.
export function CartBar({ count }: { count: number }) {
  const q = quote(count);
  return (
    <div
      className="card row"
      style={{ position: "sticky", bottom: 16, justifyContent: "space-between", boxShadow: "0 4px 20px rgba(0,0,0,.12)" }}
    >
      <span>
        <strong>{count}</strong> produto(s) selecionado(s) · {formatBRL(q.unitPriceCents)} cada ·{" "}
        <strong>{formatBRL(q.totalCents)}</strong>
      </span>
      <Link href="/carrinho" className="btn btn-primary">Revisar pedido</Link>
    </div>
  );
}
