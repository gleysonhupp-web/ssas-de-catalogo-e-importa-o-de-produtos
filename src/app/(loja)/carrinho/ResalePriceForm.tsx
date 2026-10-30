"use client";

import { useActionState } from "react";
import { saveResalePrices, type ResalePriceState } from "../actions";

// Os campos de preço ficam nas linhas da tabela e apontam para este formulário pelo atributo form.
export function ResalePriceForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState<ResalePriceState, FormData>(saveResalePrices, {});
  return (
    <form id={id} action={action} className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
      <span className="small">
        {state.error ? (
          <span className="alert">{state.error}</span>
        ) : state.saved ? (
          "Preços salvos. Eles vão para a sua loja na importação."
        ) : (
          <span className="muted">Defina o preço de venda de cada produto antes de pagar. Vazio = regra geral do checkout.</span>
        )}
      </span>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar preços"}
      </button>
    </form>
  );
}
