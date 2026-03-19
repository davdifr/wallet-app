import { describe, expect, it } from "vitest";

import { transactionSchema } from "@/lib/validations/transaction";

describe("transaction validation", () => {
  it("accetta una categoria valida coerente con il tipo expense", () => {
    const parsed = transactionSchema.safeParse({
      amount: "24.50",
      date: "2026-03-19",
      categorySlug: "groceries",
      note: "",
      source: "Carta",
      type: "expense"
    });

    expect(parsed.success).toBe(true);

    if (parsed.success) {
      expect(parsed.data.category).toBe("Spesa alimentare");
    }
  });

  it("rifiuta una categoria income usata su una spesa", () => {
    const parsed = transactionSchema.safeParse({
      amount: "24.50",
      date: "2026-03-19",
      categorySlug: "salary",
      note: "",
      source: "Carta",
      type: "expense"
    });

    expect(parsed.success).toBe(false);
  });

  it("rifiuta slug non supportati", () => {
    const parsed = transactionSchema.safeParse({
      amount: "100",
      date: "2026-03-19",
      categorySlug: "categoria-strana",
      note: "",
      source: "Banca",
      type: "income"
    });

    expect(parsed.success).toBe(false);
  });
});
