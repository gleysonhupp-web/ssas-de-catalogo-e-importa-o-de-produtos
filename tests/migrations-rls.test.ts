import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Toda tabela criada por migration precisa ter RLS ligado: sem isso, a chave pública do Supabase a expõe.
describe("migrations", () => {
  it("ligam RLS em todas as tabelas criadas", () => {
    const dir = join(__dirname, "..", "prisma", "migrations");
    const sql = readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => readFileSync(join(dir, d.name, "migration.sql"), "utf8"))
      .join("\n");
    const created = [...sql.matchAll(/CREATE TABLE "(\w+)"/g)].map((m) => m[1]);
    const protectedTables = new Set([...sql.matchAll(/ALTER TABLE "(\w+)" ENABLE ROW LEVEL SECURITY/g)].map((m) => m[1]));
    expect(created.length).toBeGreaterThan(0);
    expect(created.filter((t) => !protectedTables.has(t))).toEqual([]);
  });
});
