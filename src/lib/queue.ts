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
  await importQueue().addBulk(
    itemIds.map((id) => ({ name: "import", data: { importItemId: id }, opts: { jobId: `${id}-r${round}` } })),
  );
}
