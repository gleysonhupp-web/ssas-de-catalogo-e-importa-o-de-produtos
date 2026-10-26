import { prisma } from "@/lib/db";

// Cria uma conta com loja conectada e N produtos aprovados, isolados por um sufixo único.
export async function merchantWithCart(n: number, opts: { skuPrefix?: string } = {}) {
  const tag = `${Date.now()}${Math.floor(Math.random() * 1e6)}`;
  const account = await prisma.account.create({ data: { name: `Teste ${tag}` } });
  const user = await prisma.user.create({
    data: { email: `t${tag}@teste.com`, passwordHash: "x", accountId: account.id },
  });
  const store = await prisma.store.create({
    data: { accountId: account.id, externalStoreId: `s${tag}`, accessTokenEnc: "", scopes: "write_products", name: "Loja teste" },
  });
  const category = await prisma.catalogCategory.upsert({
    where: { slug: "teste" },
    update: {},
    create: { slug: "teste", name: "Teste" },
  });
  const products = [];
  for (let i = 0; i < n; i++) {
    const code = `CAT-TST-${tag.slice(-4)}${String(i).padStart(2, "0")}`.slice(0, 14);
    const p = await prisma.catalogProduct.create({
      data: {
        code: `${code}-${tag}-${i}`,
        name: `Produto ${i}`,
        description: "Produto de teste",
        categoryId: category.id,
        status: "APPROVED",
        suggestedPrice: 10,
        variants: { create: [{ sku: `${opts.skuPrefix ?? "SKU"}-${tag}-${i}`, options: { Cor: "Azul" } }] },
        media: { create: [{ url: "https://img/x.jpg", license: "própria", source: "teste" }] },
      },
    });
    products.push(p);
    await prisma.cartItem.create({ data: { accountId: account.id, catalogProductId: p.id } });
  }
  return { account, user, store, products };
}
