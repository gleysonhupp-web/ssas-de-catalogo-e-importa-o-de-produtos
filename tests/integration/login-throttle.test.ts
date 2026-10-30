import { describe, expect, it } from "vitest";
import { clearLoginFailures, LOGIN_WINDOW_MS, loginBlocked, recordLoginFailure } from "@/lib/login-throttle";

const unique = () => `u${Date.now()}${Math.floor(Math.random() * 1e6)}@teste.com`;

describe("limite de tentativas de login", () => {
  it("bloqueia o e-mail depois de 5 falhas e libera depois da janela", async () => {
    const email = unique();
    for (let i = 0; i < 4; i++) await recordLoginFailure(email, null);
    expect(await loginBlocked(email, null)).toBe(false);
    await recordLoginFailure(email, null);
    expect(await loginBlocked(email, null)).toBe(true);
    expect(await loginBlocked(email, null, new Date(Date.now() + LOGIN_WINDOW_MS + 1000))).toBe(false);
  });

  it("bloqueia um IP que tenta muitos e-mails diferentes", async () => {
    const ip = `10.0.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}-${Date.now()}`;
    for (let i = 0; i < 20; i++) await recordLoginFailure(unique(), ip);
    expect(await loginBlocked(unique(), ip)).toBe(true);
    expect(await loginBlocked(unique(), null)).toBe(false);
  });

  it("login certo zera a contagem do e-mail", async () => {
    const email = unique();
    for (let i = 0; i < 5; i++) await recordLoginFailure(email, null);
    await clearLoginFailures(email);
    expect(await loginBlocked(email, null)).toBe(false);
  });
});
