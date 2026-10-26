"use client";

import { useActionState } from "react";
import { csvAction, type CsvState } from "../actions";

export function CsvImport() {
  const [state, formAction, pending] = useActionState<CsvState, FormData>(csvAction, {});

  if (state.done) {
    return (
      <div className="notice">
        {state.done.created} produto(s) criados como rascunho.
        {state.done.skipped.length > 0 && ` Ignorados por já existirem: ${state.done.skipped.join(", ")}.`}
      </div>
    );
  }

  const preview = state.preview;
  return (
    <div className="stack">
      <form action={formAction} className="card row">
        <input type="file" name="file" accept=".csv,text/csv" required />
        <button className="btn" type="submit" disabled={pending}>{pending ? "Lendo..." : "Ver prévia"}</button>
      </form>

      {preview && (
        <div className="card stack">
          <strong>
            {preview.products.length} produto(s) válidos ·{" "}
            {preview.products.reduce((n, p) => n + p.variants.length, 0)} variante(s) · {preview.issues.length} erro(s)
          </strong>
          {preview.issues.length > 0 && (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Linha</th><th>Problema</th></tr></thead>
                <tbody>
                  {preview.issues.map((i, idx) => <tr key={idx}><td>{i.line}</td><td>{i.message}</td></tr>)}
                </tbody>
              </table>
            </div>
          )}
          {preview.issues.length === 0 && preview.products.length > 0 ? (
            <form action={formAction}>
              <input type="hidden" name="confirm" value="1" />
              <input type="hidden" name="csv" value={state.csv} />
              <button className="btn btn-primary" type="submit" disabled={pending}>Confirmar e criar rascunhos</button>
            </form>
          ) : (
            <p className="muted small">Corrija o arquivo e envie de novo. Nada foi gravado.</p>
          )}
        </div>
      )}
    </div>
  );
}
