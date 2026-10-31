import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { randomToken, sha256 } from "@/lib/crypto";

export { hashPassword, verifyPassword } from "@/lib/password";

const SESSION_COOKIE = "session";
const SESSION_DAYS = 30;

export async function createSession(userId: string): Promise<void> {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  // Só o hash do token fica no banco: um vazamento do banco não dá acesso às sessões.
  await prisma.session.create({ data: { id: sha256(token), userId, expiresAt } });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { id: sha256(token) } });
  jar.delete(SESSION_COOKIE);
}

// Uma consulta por requisição: a moldura (menu lateral) e a página compartilham o resultado.
export const currentUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { id: sha256(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
});

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/entrar");
  return user;
}

// Perfis internos (capítulo 7). A área interna nunca é liberada para lojistas.
const STAFF: UserRole[] = ["CONTENT_OPERATOR", "REVIEWER", "SUPPORT", "FINANCE", "ADMIN"];

export async function requireRole(...roles: UserRole[]) {
  const user = await requireUser();
  const allowed = roles.length ? roles : STAFF;
  if (!allowed.includes(user.role) && user.role !== "ADMIN") redirect("/");
  return user;
}

export function isStaff(role: UserRole): boolean {
  return STAFF.includes(role);
}
