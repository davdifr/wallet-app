import { describe, expect, it } from "vitest";

import {
  piggyBankMovementSchema,
  piggyBankSettingsSchema
} from "@/lib/validations/piggy-bank";

describe("piggy bank validations", () => {
  it("accetta una configurazione mensile valida", () => {
    const parsed = piggyBankSettingsSchema.safeParse({
      autoMonthlyAmount: "150",
      isAutoEnabled: true,
      startsOnMonth: "2026-03-01"
    });

    expect(parsed.success).toBe(true);
  });

  it("rifiuta importi negativi nella configurazione automatica", () => {
    const parsed = piggyBankSettingsSchema.safeParse({
      autoMonthlyAmount: "-5",
      isAutoEnabled: true,
      startsOnMonth: "2026-03-01"
    });

    expect(parsed.success).toBe(false);
  });

  it("rifiuta un mese di partenza non allineato al primo del mese", () => {
    const parsed = piggyBankSettingsSchema.safeParse({
      autoMonthlyAmount: "150",
      isAutoEnabled: true,
      startsOnMonth: "2026-03-15"
    });

    expect(parsed.success).toBe(false);
  });

  it("accetta aggiunta manuale valida", () => {
    const parsed = piggyBankMovementSchema.safeParse({
      amount: "42.50",
      movementType: "manual_add",
      note: "Versamento"
    });

    expect(parsed.success).toBe(true);
  });

  it("rifiuta importi negativi o nulli nei movimenti manuali", () => {
    const negative = piggyBankMovementSchema.safeParse({
      amount: "-10",
      movementType: "manual_release",
      note: ""
    });
    const zero = piggyBankMovementSchema.safeParse({
      amount: "0",
      movementType: "manual_add",
      note: ""
    });

    expect(negative.success).toBe(false);
    expect(zero.success).toBe(false);
  });
});
