import Link from "next/link";
import { AuthForm } from "../AuthForm";
import { signup } from "../actions";

export default function SignupPage() {
  return (
    <main className="container stack" style={{ maxWidth: 420 }}>
      <h1>Criar conta</h1>
      <p className="muted small">Acesso gratuito. Você só paga pelos produtos que importar.</p>
      <AuthForm action={signup} submitLabel="Criar conta">
        <label>Nome<input name="name" required autoComplete="name" /></label>
        <label>E-mail<input name="email" type="email" required autoComplete="email" /></label>
        <label>Senha<input name="password" type="password" required minLength={8} autoComplete="new-password" /></label>
        <label style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <input name="terms" type="checkbox" required /> Li e aceito os termos de uso e a política de privacidade
        </label>
      </AuthForm>
      <p className="small muted">Já tem conta? <Link href="/entrar">Entrar</Link></p>
    </main>
  );
}
