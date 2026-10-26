import { randomBytes } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "@/lib/crypto";

beforeAll(() => {
  process.env.TOKEN_ENCRYPTION_KEY = randomBytes(32).toString("base64");
});

describe("encryptSecret", () => {
  it("cifra e decifra sem expor o texto original", () => {
    const enc = encryptSecret("token-da-loja");
    expect(enc).not.toContain("token-da-loja");
    expect(decryptSecret(enc)).toBe("token-da-loja");
  });

  it("detecta adulteração", () => {
    const [iv, tag, data] = encryptSecret("abc").split(".");
    const tampered = [iv, tag, Buffer.from("xyz").toString("base64url")].join(".");
    expect(() => decryptSecret(tampered)).toThrow();
    expect(data).toBeTruthy();
  });
});
