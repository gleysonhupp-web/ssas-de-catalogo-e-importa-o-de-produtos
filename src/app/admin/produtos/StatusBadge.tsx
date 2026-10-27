import type { EditorialStatus } from "@prisma/client";

const MAP: Record<EditorialStatus, [string, string]> = {
  DRAFT: ["Rascunho", ""],
  IN_REVIEW: ["Em revisão", "badge-warn"],
  APPROVED: ["Aprovado", "badge-ok"],
  UNAVAILABLE: ["Indisponível", "badge-err"],
};

export function StatusBadge({ status }: { status: EditorialStatus }) {
  const [label, cls] = MAP[status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

export const STATUS_LABEL = Object.fromEntries(Object.entries(MAP).map(([k, v]) => [k, v[0]])) as Record<
  EditorialStatus,
  string
>;
