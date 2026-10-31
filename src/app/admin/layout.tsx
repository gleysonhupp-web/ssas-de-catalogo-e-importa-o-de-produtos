import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole();
  return (
    <AppShell>
      <div className="container stack">
        <nav className="row small">
          <strong>Administração</strong>
          <Link href="/admin">Visão geral</Link>
          <Link href="/admin/produtos">Produtos</Link>
          <Link href="/admin/produtos/importar">Lote de cadastro (CSV)</Link>
          <span className="muted" style={{ marginLeft: "auto" }}>
            {user.email} · {user.role}
          </span>
        </nav>
        {children}
      </div>
    </AppShell>
  );
}
