import { describe, expect, it } from "vitest";

import { calculatePiggyBankBalance } from "@/lib/piggy-bank/balance";

describe("calculatePiggyBankBalance", () => {
  it("restituisce zero senza configurazione o movimenti", () => {
    expect(calculatePiggyBankBalance([])).toBe(0);
  });

  it("somma piano mensile automatico e movimenti manuali su mesi diversi", () => {
    const result = calculatePiggyBankBalance([
      { amount: 200, movementType: "auto_monthly_allocation" },
      { amount: 200, movementType: "auto_monthly_allocation" },
      { amount: 50, movementType: "manual_add" },
      { amount: 20, movementType: "manual_release" }
    ]);

    expect(result).toBe(430);
  });

  it("gestisce uno svincolo parziale", () => {
    const result = calculatePiggyBankBalance([
      { amount: 300, movementType: "manual_add" },
      { amount: 120, movementType: "manual_release" }
    ]);

    expect(result).toBe(180);
  });

  it("non va sotto zero anche se i dati storici contengono uscite superiori", () => {
    const result = calculatePiggyBankBalance([
      { amount: 100, movementType: "manual_add" },
      { amount: 250, movementType: "manual_release" }
    ]);

    expect(result).toBe(0);
  });
});
