import type { Prisma } from "@prisma/client";

type LedgerInput = {
  accountId: string;
  orderId?: string;
  importItemId?: string;
  type: "GRANT" | "RESERVE" | "CONSUME" | "RELEASE" | "REFUND";
  quantity?: number;
  key: string;
};

// Lançamento idempotente: a chave única garante que a mesma operação nunca conta duas vezes.
export async function addLedger(tx: Prisma.TransactionClient, l: LedgerInput): Promise<boolean> {
  const r = await tx.creditLedgerEntry.createMany({
    data: [
      {
        accountId: l.accountId,
        orderId: l.orderId,
        importItemId: l.importItemId,
        type: l.type,
        quantity: l.quantity ?? 1,
        idempotencyKey: l.key,
      },
    ],
    skipDuplicates: true,
  });
  return r.count === 1;
}
