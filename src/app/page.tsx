import { prisma } from "@/lib/db";
import { formatBRL, quote } from "@/lib/pricing";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function Home() {
  const approved = await prisma.catalogProduct.count({ where: { status: "APPROVED" } });
  const example = quote(50);

  return (
    <main className={styles.main}>
      <h1>Sua loja com produtos cadastrados em poucos passos</h1>
      <p>
        Escolha o que deseja vender, veja o preço por item e importe diretamente para a Nuvemshop.
      </p>
      <ul className={styles.facts}>
        <li>{approved} produtos disponíveis no catálogo</li>
        <li>{formatBRL(example.unitPriceCents)} por produto, sem mensalidade</li>
        <li>
          Exemplo: 50 produtos por {formatBRL(example.totalCents)}
        </li>
      </ul>
    </main>
  );
}
