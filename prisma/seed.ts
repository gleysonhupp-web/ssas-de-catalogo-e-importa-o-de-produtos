// Lote-piloto de demonstração: nicho Beleza > Maquiagem, dados fictícios.
// As imagens são placeholders sem marca; substituir por fotos licenciadas antes de vender.
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

const subcategories = [
  { slug: "batom", name: "Batom" },
  { slug: "base", name: "Base" },
  { slug: "paleta", name: "Paleta de sombras" },
  { slug: "pincel", name: "Pincéis" },
];

const colors = ["01 Nude", "02 Rosé", "03 Vermelho", "04 Vinho", "05 Coral"];

async function main() {
  const beleza = await prisma.catalogCategory.upsert({
    where: { slug: "beleza" },
    update: {},
    create: { slug: "beleza", name: "Beleza" },
  });
  const maquiagem = await prisma.catalogCategory.upsert({
    where: { slug: "maquiagem" },
    update: {},
    create: { slug: "maquiagem", name: "Maquiagem", parentId: beleza.id },
  });

  let n = 0;
  for (const sub of subcategories) {
    const cat = await prisma.catalogCategory.upsert({
      where: { slug: sub.slug },
      update: {},
      create: { slug: sub.slug, name: sub.name, parentId: maquiagem.id },
    });
    for (let i = 1; i <= 5; i++) {
      n++;
      const code = `CAT-BEA-${String(n).padStart(6, "0")}`;
      const hasColors = sub.slug === "batom" || sub.slug === "base";
      await prisma.catalogProduct.upsert({
        where: { code },
        update: {},
        create: {
          code,
          name: `${sub.name} demonstração ${i}`,
          description: `Produto fictício para testes do fluxo de importação (${sub.name.toLowerCase()}).`,
          brand: "Marca Demo",
          categoryId: cat.id,
          status: "APPROVED",
          suggestedPrice: 29.9 + i * 5,
          variants: {
            create: (hasColors ? colors : ["Único"]).map((c, idx) => ({
              sku: `${code}-${idx + 1}`,
              options: hasColors ? { Cor: c } : {},
            })),
          },
          media: {
            create: [
              {
                url: `https://placehold.co/800x800/png?text=${encodeURIComponent(sub.name + " " + i)}`,
                position: 0,
                altText: `${sub.name} demonstração ${i}`,
                license: "placeholder-demo",
                source: "placehold.co",
              },
            ],
          },
        },
      });
    }
  }
  console.log(`Catálogo de demonstração com ${n} produtos.`);

  // Primeiro administrador: ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:seed
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    const email = ADMIN_EMAIL.toLowerCase();
    if (!(await prisma.user.findUnique({ where: { email } }))) {
      await prisma.user.create({
        data: {
          email,
          role: "ADMIN",
          passwordHash: await hashPassword(ADMIN_PASSWORD),
          account: { create: { name: "Administração", termsAcceptedAt: new Date() } },
        },
      });
      console.log(`Administrador ${email} criado.`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
