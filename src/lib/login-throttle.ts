import "server-only";
import { prisma } from "@/lib/db";
import { sha256 } from "@/lib/crypto";

// Proteção contra tentativas excessivas de login (força bruta e teste de senhas em massa).
// As falhas ficam no AuditLog com e-mail e IP em hash: nada de dado pessoal em texto puro.

export const LOGIN_WINDOW_MS = 15 * 60_000;
const MAX_FAILURES_PER_EMAIL = 5;
const MAX_FAILURES_PER_IP = 20;
const EVENT = "auth.login_failed";

function keys(email: string, ip: string | null) {
  return { email: sha256(`email:${email}`), ip: ip ? sha256(`ip:${ip}`) : null };
}

async function failures(entity: "Email" | "IP", entityId: string, now: Date) {
  return prisma.auditLog.count({
    where: { event: EVENT, entity, entityId, createdAt: { gte: new Date(now.getTime() - LOGIN_WINDOW_MS) } },
  });
}

export async function loginBlocked(email: string, ip: string | null, now = new Date()): Promise<boolean> {
  const k = keys(email, ip);
  if ((await failures("Email", k.email, now)) >= MAX_FAILURES_PER_EMAIL) return true;
  return k.ip ? (await failures("IP", k.ip, now)) >= MAX_FAILURES_PER_IP : false;
}

export async function recordLoginFailure(email: string, ip: string | null): Promise<void> {
  const k = keys(email, ip);
  await prisma.auditLog.createMany({
    data: [
      { event: EVENT, entity: "Email", entityId: k.email },
      ...(k.ip ? [{ event: EVENT, entity: "IP", entityId: k.ip }] : []),
    ],
  });
}

// Login certo zera a contagem do e-mail (o limite por IP continua valendo).
export async function clearLoginFailures(email: string): Promise<void> {
  await prisma.auditLog.deleteMany({ where: { event: EVENT, entity: "Email", entityId: keys(email, null).email } });
}
