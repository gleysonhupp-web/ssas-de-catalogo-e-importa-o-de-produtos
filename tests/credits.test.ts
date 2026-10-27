import { describe, expect, it } from "vitest";
import { canApply, computeBalance } from "@/lib/credits";

describe("computeBalance", () => {
  it("reproduz o exemplo da Ana: 50 liberados, 48 concluídos, 2 com falha devolvidos", () => {
    const b = computeBalance([
      { type: "GRANT", quantity: 50 },
      { type: "RESERVE", quantity: 50 },
      { type: "CONSUME", quantity: 48 },
      { type: "RELEASE", quantity: 2 },
    ]);
    expect(b).toEqual({ available: 2, reserved: 0, consumed: 48 });
  });

  it("não permite reservar além do disponível", () => {
    const b = computeBalance([{ type: "GRANT", quantity: 1 }]);
    expect(canApply(b, { type: "RESERVE", quantity: 1 })).toBe(true);
    expect(canApply(b, { type: "RESERVE", quantity: 2 })).toBe(false);
  });

  it("rejeita lançamento com quantidade não positiva", () => {
    expect(() => computeBalance([{ type: "GRANT", quantity: 0 }])).toThrow();
  });
});
