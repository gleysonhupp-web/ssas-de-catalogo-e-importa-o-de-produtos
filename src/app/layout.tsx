import type { Metadata } from "next";
import Link from "next/link";
import { Geist } from "next/font/google";
import { currentUser, isStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logout } from "@/app/(auth)/actions";
import { Logo } from "@/components/Logo";
import { SidebarNav, type NavItem } from "@/components/SidebarNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

// Aplica o tema salvo antes da primeira pintura; sem escolha salva, segue o sistema.
const THEME_SCRIPT = `try{var t=localStorage.getItem("tema");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;

export const metadata: Metadata = {
  title: { default: "LoteOn | Catálogo e importação de produtos", template: "%s | LoteOn" },
  description: "Escolha produtos e importe para sua loja Nuvemshop",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await currentUser();
  const cartCount = user ? await prisma.cartItem.count({ where: { accountId: user.accountId } }) : 0;

  const items: NavItem[] = user
    ? [
        { href: "/catalogo", label: "Catálogo", icon: "catalog" },
        { href: "/lojas", label: "Minha loja", icon: "store" },
        { href: "/pedidos", label: "Importações", icon: "imports" },
        { href: "/carrinho", label: "Carrinho", icon: "cart", badge: cartCount },
        ...(isStaff(user.role) ? [{ href: "/admin", label: "Admin", icon: "admin" } as const] : []),
      ]
    : [
        { href: "/catalogo", label: "Catálogo", icon: "catalog" },
        { href: "/entrar", label: "Entrar", icon: "login" },
        { href: "/cadastro", label: "Criar conta", icon: "signup" },
      ];

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className={geistSans.variable}>
        <div className="shell">
          <aside className="sidebar">
            <Link href="/" className="brand" aria-label="LoteOn, página inicial"><Logo /></Link>
            <SidebarNav items={items} />
            <div className="side-footer">
              <ThemeToggle />
              {user && (
                <>
                  <span className="side-user small muted" title={user.email}>{user.email}</span>
                  <form action={logout}>
                    <button className="side-link side-button" type="submit">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M9 21H4V3h5M16 17l5-5-5-5M21 12H9" />
                      </svg>
                      <span>Sair</span>
                    </button>
                  </form>
                </>
              )}
            </div>
          </aside>
          <div className="content">{children}</div>
        </div>
      </body>
    </html>
  );
}
