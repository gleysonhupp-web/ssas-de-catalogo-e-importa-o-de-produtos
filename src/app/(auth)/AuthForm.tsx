"use client";

import { startTransition, useActionState } from "react";
import type { FormState } from "./actions";

type Props = {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  submitLabel: string;
  children: React.ReactNode;
};

export function AuthForm({ action, submitLabel, children }: Props) {
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
      {children}
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Aguarde..." : submitLabel}
      </button>
    </form>
  );
}
