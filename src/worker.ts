// Worker de importação: npm run worker (no Render, um "Background Worker").
// Consome a fila respeitando o limite da Nuvemshop e varre itens esquecidos
// (por exemplo, se o Redis foi reiniciado) para nunca deixar um item pago parado.

import http from "node:http";
import { Worker } from "bullmq";
import { prisma } from "@/lib/db";
import { processImportItem, RetryableImportError } from "@/lib/importer";
import { enqueueItems, IMPORT_QUEUE, importQueue, redisConnection } from "@/lib/queue";

const PICKUP_EVERY_MS = 5_000;
const SWEEP_EVERY_MS = 5 * 60_000;
const STUCK_AFTER_MS = 10 * 60_000;

const worker = new Worker<{ importItemId: string }>(
  IMPORT_QUEUE,
  async (job) => {
    const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
    try {
      return await processImportItem(job.data.importItemId, { isLastAttempt });
    } catch (e) {
      if (e instanceof RetryableImportError) throw e; // a fila tenta de novo com recuo exponencial
      console.error("importação: erro inesperado", job.data.importItemId, e);
      throw e;
    }
  },
  {
    connection: redisConnection(),
    concurrency: 2,
    // Limite padrão da Nuvemshop: vazão de 2 requisições/s. Cada item usa até 2 chamadas.
    limiter: { max: 1, duration: 1000 },
  },
);

worker.on("completed", (job, result) => console.log(`item ${job.data.importItemId}: ${result}`));
worker.on("failed", (job, err) => console.warn(`item ${job?.data.importItemId}: ${err.message}`));

async function sweep() {
  // Pedidos não pagos dentro do prazo deixam de valer.
  await prisma.order.updateMany({
    where: { status: "PENDING_PAYMENT", expiresAt: { lt: new Date() } },
    data: { status: "EXPIRED" },
  });
  // Com a fila ainda trabalhando, itens "parados" são só itens esperando a vez.
  const pending = await importQueue().getJobCounts("waiting", "active", "delayed");
  if (pending.waiting + pending.active + pending.delayed > 0) return;
  const stuck = await prisma.importItem.findMany({
    where: {
      status: { in: ["RESERVED", "QUEUED", "PROCESSING"] },
      updatedAt: { lt: new Date(Date.now() - STUCK_AFTER_MS) },
      batch: { order: { status: "PAID" } },
    },
    select: { id: true, retryRound: true },
    take: 500,
  });
  // Sufixo novo: um job antigo com o mesmo ID (já falhado) impediria o reenfileiramento.
  for (const item of stuck) await enqueueItems([item.id], `${item.retryRound}-s${Date.now()}`);
  if (stuck.length) console.log(`varredura: ${stuck.length} item(ns) reenfileirado(s)`);
}

// Itens pagos e ainda não enfileirados (o site pode não ter acesso ao Redis).
// O ID da tarefa inclui a rodada, então reenfileirar um item já na fila não duplica nada.
async function pickup() {
  const items = await prisma.importItem.findMany({
    where: { status: "RESERVED", batch: { order: { status: "PAID" } } },
    select: { id: true, retryRound: true },
    orderBy: { createdAt: "asc" },
    take: 500,
  });
  for (const item of items) await enqueueItems([item.id], item.retryRound);
}

void sweep();
const timer = setInterval(() => void sweep().catch((e) => console.error("varredura", e)), SWEEP_EVERY_MS);
let picking = false;
const pickupTimer = setInterval(() => {
  if (picking) return;
  picking = true;
  pickup()
    .catch((e) => console.error("busca de itens", e))
    .finally(() => (picking = false));
}, PICKUP_EVERY_MS);

// No plano gratuito do Render o worker roda como Web Service: esta rota de saúde mantém o
// serviço acordado (o UptimeRobot a consulta a cada 5 minutos) e mostra o tamanho da fila.
const server = process.env.PORT
  ? http
      .createServer(async (_req, res) => {
        try {
          const counts = await importQueue().getJobCounts("waiting", "active", "delayed", "failed");
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true, fila: counts }));
        } catch {
          res.writeHead(503, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: false }));
        }
      })
      .listen(Number(process.env.PORT))
  : null;

async function shutdown() {
  server?.close();
  clearInterval(timer);
  clearInterval(pickupTimer);
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
console.log("Worker de importação iniciado");
