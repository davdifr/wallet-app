import { describe, expect, it } from "vitest";

import { savingGoalSchema } from "@/lib/validations/saving-goal";

describe("saving goal validation", () => {
  it("accetta un goal senza target date", () => {
    const parsed = savingGoalSchema.safeParse({
      title: "Fondo emergenza",
      description: "",
      targetAmount: "1200",
      targetDate: "",
      priority: "high"
    });

    expect(parsed.success).toBe(true);
  });

  it("rifiuta una target date non valida", () => {
    const parsed = savingGoalSchema.safeParse({
      title: "Fondo emergenza",
      description: "",
      targetAmount: "1200",
      targetDate: "31-12-2026",
      priority: "high"
    });

    expect(parsed.success).toBe(false);
  });
});
