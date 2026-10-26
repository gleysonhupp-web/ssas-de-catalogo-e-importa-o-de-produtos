"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { EditorialStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { changeStatus, importParsedProducts, saveProduct } from "@/lib/catalog-admin";
import { parseCatalogCsv, type CsvResult } from "@/lib/catalog-csv";
import { parseProductForm } from "@/lib/product-form";

export type SaveState = { error?: string };

export async function saveProductAction(id: string | null, _: SaveState, form: FormData): Promise<SaveState> {
  const user = await requireRole("CONTENT_OPERATOR", "REVIEWER");
  const parsed = parseProductForm(Object.fromEntries(form) as Record<string, string>);
  if (!parsed.ok) return { error: parsed.error };
  let productId: string;
  try {
    productId = (await saveProduct(id, parsed.data, user.id)).id;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "Código ou SKU já usado por outro produto" };
    }
    throw e;
  }
  revalidatePath("/admin/produtos");
  redirect(`/admin/produtos/${productId}?salvo=1`);
}

export async function changeStatusAction(id: string, to: EditorialStatus) {
  // Aprovar exige revisor; os demais movimentos também valem para o operador de conteúdo.
  const user = to === "APPROVED" ? await requireRole("REVIEWER") : await requireRole("CONTENT_OPERATOR", "REVIEWER");
  try {
    await changeStatus(id, to, user.id);
  } catch (e) {
    redirect(`/admin/produtos/${id}?erro=${encodeURIComponent((e as Error).message)}`);
  }
  revalidatePath(`/admin/produtos/${id}`);
  redirect(`/admin/produtos/${id}`);
}

export type CsvState = { preview?: CsvResult; csv?: string; done?: { created: number; skipped: string[] } };

export async function csvAction(_: CsvState, form: FormData): Promise<CsvState> {
  const user = await requireRole("CONTENT_OPERATOR", "REVIEWER");
  const confirmed = form.get("confirm") === "1";
  const file = form.get("file");
  const csv = confirmed ? String(form.get("csv") ?? "") : file instanceof File ? await file.text() : "";

  const slugs = new Set((await prisma.catalogCategory.findMany({ select: { slug: true } })).map((c) => c.slug));
  const result = parseCatalogCsv(csv, slugs);

  // Só grava depois que o operador viu a prévia e o arquivo não tem nenhum erro.
  if (confirmed && result.issues.length === 0) {
    const done = await importParsedProducts(result.products, user.id);
    revalidatePath("/admin/produtos");
    return { done };
  }
  return { preview: result, csv };
}
