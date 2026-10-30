"use client";

import { startTransition, useActionState } from "react";
import { startCheckout, type CheckoutState } from "./actions";

export function CheckoutForm({ total }: { total: string }) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(startCheckout, {});
  return (
    <form
      className="card stack"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
    >
      {state.error && <p className="alert">{state.error}</p>}
      <strong>Como os produtos chegam na sua loja</strong>
      <label>
        Preço de venda dos produtos sem preço definido no carrinho
        <select name="priceMode" defaultValue="suggested">
          <option value="suggested">Usar o preço sugerido do catálogo</option>
          <option value="markup">Preço sugerido + porcentagem</option>
          <option value="none">Sem preço (vou definir na Nuvemshop)</option>
        </select>
      </label>
      <label>
        Porcentagem sobre o sugerido (só para a opção acima)
        <input name="markupPercent" defaultValue="0" inputMode="decimal" />
      </label>
      <label>
        Estoque inicial de cada variante
        <select name="stock" defaultValue="0">
          <option value="0">0 (eu ajusto depois)</option>
          <option value="ilimitado">Ilimitado</option>
          <option value="1">1</option>
          <option value="5">5</option>
          <option value="10">10</option>
        </select>
      </label>
      <label style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <input type="checkbox" name="publish" /> Publicar visível na loja (recomendado: deixar oculto e revisar antes)
      </label>
      <label style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
        <input type="checkbox" name="terms" required style={{ marginTop: 4 }} />
        <span className="small">
          Entendo que estou pagando pela preparação e publicação dos anúncios, não pela mercadoria. Itens que falharem
          podem ser reprocessados sem nova cobrança.
        </span>
      </label>
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Gerando pagamento..." : `Pagar ${total} com Pix ou cartão`}
      </button>
    </form>
  );
}
