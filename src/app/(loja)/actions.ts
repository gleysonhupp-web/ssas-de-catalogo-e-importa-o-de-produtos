"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseBRLToCents } from "@/lib/pricing";

async function accountOrLogin() {
  const user = await currentUser();
  if (!user) redirect("/cadastro");
  return user.accountId;
}

export async function addToCart(productId: string) {
  const accountId = await accountOrLogin();
  const product = await prisma.catalogProduct.findFirst({ where: { id: productId, status: "APPROVED" } });
  if (product) {
    await prisma.cartItem.upsert({
      where: { accountId_catalogProductId: { accountId, catalogProductId: productId } },
      update: {},
      create: { accountId, catalogProductId: productId },
    });
  }
  revalidatePath("/", "layout");
}

export async function removeFromCart(productId: string) {
  const accountId = await accountOrLogin();
  await prisma.cartItem.deleteMany({ where: { accountId, catalogProductId: productId } });
  revalidatePath("/", "layout");
}

// Remove do carrinho o que não pode ser cobrado: indisponível ou já importado.
export async function removeProblemItems(productIds: string[]) {
  const accountId = await accountOrLogin();
  await prisma.cartItem.deleteMany({ where: { accountId, catalogProductId: { in: productIds } } });
  revalidatePath("/", "layout");
}

export type ResalePriceState = { error?: string; saved?: boolean };

// Preço de venda de cada produto do carrinho, definido antes da importação. Campo vazio volta para a regra geral.
export async function saveResalePrices(_prev: ResalePriceState, form: FormData): Promise<ResalePriceState> {
  const accountId = await accountOrLogin();
  const cart = await prisma.cartItem.findMany({ where: { accountId }, include: { product: { select: { name: true } } } });
  const updates: { catalogProductId: string; cents: number | null }[] = [];
  for (const item of cart) {
    const raw = form.get(`price_${item.catalogProductId}`);
    if (raw === null) continue;
    const cents = parseBRLToCents(String(raw));
    if (cents === undefined) return { error: `Preço inválido para "${item.product.name}". Use, por exemplo, 399,90.` };
    updates.push({ catalogProductId: item.catalogProductId, cents });
  }
  await prisma.$transaction(
    updates.map((u) =>
      prisma.cartItem.update({
        where: { accountId_catalogProductId: { accountId, catalogProductId: u.catalogProductId } },
        data: { resalePriceCents: u.cents },
      }),
    ),
  );
  revalidatePath("/carrinho");
  return { saved: true };
}
