"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { clearLoginFailures, loginBlocked, recordLoginFailure } from "@/lib/login-throttle";

const signupSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome"),
  email: z.email("E-mail inválido").transform((e) => e.toLowerCase()),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres"),
  terms: z.literal("on", { message: "É preciso aceitar os termos" }),
});

export type FormState = { error?: string };

export async function signup(_: FormState, form: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, password } = parsed.data;

  if (await prisma.user.findUnique({ where: { email } })) {
    return { error: "Já existe uma conta com esse e-mail" };
  }
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: await hashPassword(password),
      account: { create: { name, termsAcceptedAt: new Date() } },
    },
  });
  await createSession(user.id);
  redirect("/catalogo");
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").toLowerCase();
  const password = String(form.get("password") ?? "");
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  if (await loginBlocked(email, ip)) {
    return { error: "Muitas tentativas sem sucesso. Aguarde 15 minutos e tente de novo." };
  }
  const user = await prisma.user.findUnique({ where: { email } });
  // Sem usuário, a senha é conferida contra um hash fictício: o tempo de resposta não revela quais e-mails existem.
  const ok = await verifyPassword(password, user?.passwordHash ?? (await dummyHash()));
  if (!user || !ok) {
    await recordLoginFailure(email, ip);
    return { error: "E-mail ou senha incorretos" };
  }
  await clearLoginFailures(email);
  await createSession(user.id);
  redirect(user.role === "MERCHANT" ? "/catalogo" : "/admin");
}

let dummy: Promise<string> | null = null;
function dummyHash() {
  dummy ??= hashPassword("senha-ficticia-para-tempo-constante");
  return dummy;
}

export async function logout() {
  await destroySession();
  redirect("/");
}
