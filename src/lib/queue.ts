import { Queue } from "bullmq";
import IORedis from "ioredis";

// Fila de importação: uma tarefa por produto, com ID da tarefa = ID do ImportItem
// para que enfileirar duas vezes o mesmo item não gere duas tarefas.
export const IMPORT_QUEUE = "import-items";

let connection: IORedis | null = null;
let queue: Queue | null = null;

export function redisConnection(): IORedis {
  connection ??= new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", { maxRetriesPerRequest: null });
  return connection;
}

export function importQueue(): Queue {
  queue ??= new Queue(IMPORT_QUEUE, {
    connection: redisConnection(),
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: "exponential", delay: 5_000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    },
  });
  return queue;
}

// "round" diferencia um reprocessamento pedido pelo lojista da primeira tentativa.
export async function enqueueItems(itemIds: string[], round: number | string = 0) {
  if (itemIds.length === 0) return;
  // Sem Redis configurado (ex.: o site na Vercel), o worker encontra os itens novos direto no banco.
  if (!process.env.REDIS_URL) return wakeWorker();
  await importQueue().addBulk(
    itemIds.map((id) => ({ name: "import", data: { importItemId: id }, opts: { jobId: `${id}-r${round}` } })),
  );
}

// O worker no plano gratuito do Render dorme sem tráfego; uma requisição o acorda para buscar os itens.
async function wakeWorker() {
  const url = process.env.WORKER_URL;
  if (!url) return;
  await fetch(url, { signal: AbortSignal.timeout(2_500) }).catch(() => {});
}
