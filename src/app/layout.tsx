import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

// Aplica o tema salvo antes da primeira pintura; sem escolha salva, segue o sistema.
const THEME_SCRIPT = `try{var t=localStorage.getItem("tema");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;

export const metadata: Metadata = {
  title: { default: "LoteOn | Catálogo e importação de produtos", template: "%s | LoteOn" },
  description: "Escolha produtos e importe para sua loja Nuvemshop",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className={geistSans.variable}>{children}</body>
    </html>
  );
}
