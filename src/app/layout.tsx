import type { Metadata } from "next";
import Link from "next/link";
import { Geist } from "next/font/google";
import { currentUser, isStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logout } from "@/app/(auth)/actions";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Catálogo e importação de produtos",
  description: "Escolha produtos e importe para sua loja Nuvemshop",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await currentUser();
  const cartCount = user ? await prisma.cartItem.count({ where: { accountId: user.accountId } }) : 0;

  return (
    <html lang="pt-BR">
      <body className={geistSans.variable}>
        <header className="header">
          <div className="container" style={{ paddingTop: 12, paddingBottom: 12 }}>
            <nav>
              <Link href="/" className="brand">Catálogo Pronto</Link>
              <Link href="/catalogo">Catálogo</Link>
              {user && <Link href="/lojas">Minha loja</Link>}
              {user && <Link href="/pedidos">Importações</Link>}
              {user && <Link href="/carrinho">Carrinho ({cartCount})</Link>}
              {user && isStaff(user.role) && <Link href="/admin">Admin</Link>}
              {user ? (
                <form action={logout}>
                  <button className="btn" type="submit">Sair</button>
                </form>
              ) : (
                <>
                  <Link href="/entrar">Entrar</Link>
                  <Link href="/cadastro" className="btn btn-primary">Criar conta</Link>
                </>
              )}
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
