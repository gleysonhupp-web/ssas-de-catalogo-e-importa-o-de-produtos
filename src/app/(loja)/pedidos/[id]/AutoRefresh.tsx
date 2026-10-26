"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Atualiza o progresso enquanto há pagamento pendente ou itens na fila.
export function AutoRefresh({ everyMs = 3000 }: { everyMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), everyMs);
    return () => clearInterval(t);
  }, [router, everyMs]);
  return null;
}
