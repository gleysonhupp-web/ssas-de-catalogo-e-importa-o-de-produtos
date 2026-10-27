import Link from "next/link";
import { AuthForm } from "../AuthForm";
import { login } from "../actions";

export default function LoginPage() {
  return (
    <main className="container stack" style={{ maxWidth: 420 }}>
      <h1>Entrar</h1>
      <AuthForm action={login} submitLabel="Entrar">
        <label>E-mail<input name="email" type="email" required autoComplete="email" /></label>
        <label>Senha<input name="password" type="password" required autoComplete="current-password" /></label>
      </AuthForm>
      <p className="small muted">Ainda não tem conta? <Link href="/cadastro">Criar conta</Link></p>
    </main>
  );
}
