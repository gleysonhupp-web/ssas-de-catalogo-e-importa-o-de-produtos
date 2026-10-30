"use client";

import { startTransition, useActionState } from "react";
import type { SaveState } from "./actions";

type Props = {
  action: (state: SaveState, form: FormData) => Promise<SaveState>;
  categories: { id: string; label: string }[];
  initial?: Record<string, string>;
};

export function ProductForm({ action, categories, initial = {} }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form
      className="card stack"
      // Envio manual: o envio padrão de ações limpa o formulário e o usuário perderia o que digitou.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
    >
      {state.error && <p className="alert">{state.error}</p>}
      <div className="row" style={{ alignItems: "stretch" }}>
        <label style={{ flex: 1 }}>Código interno<input name="code" defaultValue={initial.code} placeholder="CAT-BEA-000142" required /></label>
        <label style={{ flex: 2 }}>Nome comercial<input name="name" defaultValue={initial.name} required /></label>
      </div>
      <label>Descrição e atributos<textarea name="description" defaultValue={initial.description} required /></label>
      <div className="row" style={{ alignItems: "stretch" }}>
        <label style={{ flex: 1 }}>Marca<input name="brand" defaultValue={initial.brand} /></label>
        <label style={{ flex: 1 }}>
          Categoria
          <select name="categoryId" defaultValue={initial.categoryId} required>
            <option value="">Escolha...</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>
        <label style={{ flex: 1 }}>Preço no fornecedor (R$)<input name="supplierPrice" defaultValue={initial.supplierPrice} inputMode="decimal" /></label>
        <label style={{ flex: 1 }}>Preço sugerido de venda (R$)<input name="suggestedPrice" defaultValue={initial.suggestedPrice} inputMode="decimal" /></label>
      </div>
      <label>
        Variantes <span className="muted small">uma por linha: SKU ; Cor:05|Volume:4ml ; GTIN</span>
        <textarea name="variants" defaultValue={initial.variants} required />
      </label>
      <label>
        Fotos <span className="muted small">uma por linha, a primeira é a principal: URL ; licença ; origem</span>
        <textarea name="images" defaultValue={initial.images} required />
      </label>
      <label>Regulação / observações<textarea name="regulatoryNotes" defaultValue={initial.regulatoryNotes} style={{ minHeight: 60 }} /></label>
      <div className="row">
        <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar"}</button>
      </div>
    </form>
  );
}
