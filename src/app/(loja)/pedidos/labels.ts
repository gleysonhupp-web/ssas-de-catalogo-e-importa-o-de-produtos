import type { ImportItemStatus, OrderStatus } from "@prisma/client";

export const ORDER_LABEL: Record<OrderStatus, string> = {
  DRAFT: "Rascunho",
  PENDING_PAYMENT: "Aguardando pagamento",
  PAID: "Pago",
  EXPIRED: "Expirado",
  CANCELED: "Cancelado",
};

export const ITEM_LABEL: Record<ImportItemStatus, [string, string]> = {
  SELECTED: ["Selecionado", ""],
  RESERVED: ["Na fila", ""],
  QUEUED: ["Na fila (nova tentativa)", "badge-warn"],
  PROCESSING: ["Enviando", "badge-warn"],
  DONE: ["Concluído", "badge-ok"],
  FAILED: ["Falhou", "badge-err"],
  SKIPPED: ["Cancelado", ""],
};
