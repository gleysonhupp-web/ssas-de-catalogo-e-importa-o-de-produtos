import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { activeStore } from "@/lib/merchant";
import { billableCartProducts } from "@/lib/orders";
import { formatBRL, quote } from "@/lib/pricing";
import { CheckoutForm } from "./CheckoutForm";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await requireUser();
  const store = await activeStore(user.accountId);
  if (!store) redirect("/lojas");
  const products = await billableCartProducts(user.accountId, store.id);
  if (products.length === 0) redirect("/carrinho");
  const q = quote(products.length);

  return (
    <main className="container stack" style={{ maxWidth: 640 }}>
      <h1>Pagamento</h1>
      <div className="card stack">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span>Destino</span>
          <strong>{store.name ?? `Loja ${store.externalStoreId}`}</strong>
        </div>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span>{q.quantity} produto(s) × {formatBRL(q.unitPriceCents)}</span>
          <strong style={{ fontSize: 20 }}>{formatBRL(q.totalCents)}</strong>
        </div>
        <p className="muted small">
          O valor fica travado neste pedido por 24 horas. A importação só começa depois que o pagamento for confirmado.{" "}
          <Link href="/carrinho">Revisar itens</Link>
        </p>
      </div>
      <CheckoutForm total={formatBRL(q.totalCents)} />
    </main>
  );
}
