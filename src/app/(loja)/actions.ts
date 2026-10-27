"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
