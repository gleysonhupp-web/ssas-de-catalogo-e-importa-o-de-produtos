"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { retryFailedItems } from "@/lib/importer";
import { activeStore } from "@/lib/merchant";
import { enqueueItems } from "@/lib/queue";

// Reprocessa os itens com falha sem nova cobrança. Se a loja foi reconectada, o lote passa a usar a conexão atual.
export async function retryBatch(batchId: string) {
  const user = await requireUser();
  const store = await activeStore(user.accountId);
  const batch = await prisma.importBatch.findFirst({ where: { id: batchId, order: { accountId: user.accountId } }, include: { store: true } });
  if (!batch) return;
  if (store && batch.store.externalStoreId !== store.externalStoreId) return; // nunca envia para outra loja
  const { ids, round } = await retryFailedItems(batchId, user.accountId);
  await enqueueItems(ids, round);
  revalidatePath(`/pedidos/${batch.orderId}`);
}
