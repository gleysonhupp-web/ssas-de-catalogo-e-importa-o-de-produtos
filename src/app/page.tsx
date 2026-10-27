import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatBRL, quote } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function Home() {
  const approved = await prisma.catalogProduct.count({ where: { status: "APPROVED" } });
  const example = quote(50);

  return (
    <main className="container stack" style={{ maxWidth: 720, paddingTop: 64 }}>
      <h1>Sua loja com produtos cadastrados em poucos passos</h1>
      <p className="muted">
        Escolha o que deseja vender, veja o preço por item e importe diretamente para a Nuvemshop.
      </p>
      <ul className="stack" style={{ gap: 8, paddingLeft: 20 }}>
        <li>{approved} produtos disponíveis no catálogo</li>
        <li>{formatBRL(example.unitPriceCents)} por produto, sem mensalidade</li>
        <li>Exemplo: 50 produtos por {formatBRL(example.totalCents)}</li>
      </ul>
      <div className="row">
        <Link href="/catalogo" className="btn btn-primary">Explorar produtos</Link>
      </div>
    </main>
  );
}
