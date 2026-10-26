// Livro-razão de créditos (capítulos 5 e 11).
// Crédito: disponível → reservado → consumido / devolvido.
// Os lançamentos guardam a quantidade positiva; o efeito no saldo vem do tipo.

export type LedgerType = "GRANT" | "RESERVE" | "CONSUME" | "RELEASE" | "REFUND";

export interface LedgerLine {
  type: LedgerType;
  quantity: number;
}

export interface Balance {
  available: number; // pode ser reservado para novas importações
  reserved: number; // preso a itens em andamento
  consumed: number; // produtos efetivamente criados na loja
}

export function computeBalance(lines: LedgerLine[]): Balance {
  const b: Balance = { available: 0, reserved: 0, consumed: 0 };
  for (const { type, quantity } of lines) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(`Lançamento com quantidade inválida: ${quantity}`);
    }
    switch (type) {
      case "GRANT":
        b.available += quantity;
        break;
      case "RESERVE":
        b.available -= quantity;
        b.reserved += quantity;
        break;
      case "CONSUME":
        b.reserved -= quantity;
        b.consumed += quantity;
        break;
      case "RELEASE":
        b.reserved -= quantity;
        b.available += quantity;
        break;
      case "REFUND":
        b.available -= quantity;
        break;
    }
  }
  return b;
}

// Chaves únicas tornam cada movimento idempotente: repetir a operação não duplica o lançamento.
export const ledgerKey = {
  grant: (orderId: string) => `grant:${orderId}`,
  reserve: (importItemId: string) => `reserve:${importItemId}`,
  consume: (importItemId: string) => `consume:${importItemId}`,
  release: (importItemId: string, attempt: number) => `release:${importItemId}:${attempt}`,
  refund: (orderId: string, refundId: string) => `refund:${orderId}:${refundId}`,
};

// Verifica se um próximo lançamento é permitido sem deixar o saldo negativo.
export function canApply(balance: Balance, next: LedgerLine): boolean {
  const after = computeBalanceFrom(balance, next);
  return after.available >= 0 && after.reserved >= 0;
}

function computeBalanceFrom(start: Balance, line: LedgerLine): Balance {
  const delta = computeBalance([line]);
  return {
    available: start.available + delta.available,
    reserved: start.reserved + delta.reserved,
    consumed: start.consumed + delta.consumed,
  };
}
