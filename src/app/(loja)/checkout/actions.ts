"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { activeStore } from "@/lib/merchant";
import { CheckoutError, createOrderFromCart, type ImportSettings } from "@/lib/orders";
import { paymentProvider } from "@/lib/payments";

export type CheckoutState = { error?: string };

export async function startCheckout(_: CheckoutState, form: FormData): Promise<CheckoutState> {
  const user = await requireUser();
  const store = await activeStore(user.accountId);
  if (!store) return { error: "Conecte sua loja Nuvemshop antes de pagar" };
  if (form.get("terms") !== "on") return { error: "É preciso aceitar as condições da compra" };

  const priceMode = String(form.get("priceMode")) as ImportSettings["priceMode"];
  const markupPercent = Number(String(form.get("markupPercent") ?? "0").replace(",", "."));
  const stockRaw = String(form.get("stock") ?? "0");
  const settings: ImportSettings = {
    priceMode: ["suggested", "markup", "none"].includes(priceMode) ? priceMode : "suggested",
    markupPercent: Number.isFinite(markupPercent) && markupPercent >= 0 && markupPercent <= 1000 ? markupPercent : 0,
    publish: form.get("publish") === "on",
    stock: stockRaw === "ilimitado" ? null : Math.max(0, Math.floor(Number(stockRaw) || 0)),
  };

  let checkoutUrl: string;
  try {
    const order = await createOrderFromCart(user.accountId, store.id, settings);
    const provider = paymentProvider();
    const checkout = await provider.createCheckout({
      orderId: order.id,
      title: `Importação de ${order.quantity} produto(s) para a Nuvemshop`,
      quantity: order.quantity,
      unitPriceCents: order.unitPriceCents,
      payerEmail: user.email,
      appUrl: process.env.APP_URL ?? "http://localhost:3000",
    });
    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: provider.name,
        amountCents: order.totalCents,
        status: "CREATED",
        checkoutUrl: checkout.checkoutUrl,
      },
    });
    checkoutUrl = checkout.checkoutUrl;
  } catch (e) {
    if (e instanceof CheckoutError) return { error: e.message };
    throw e;
  }
  redirect(checkoutUrl);
}
