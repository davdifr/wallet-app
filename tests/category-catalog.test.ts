import { describe, expect, it } from "vitest";

import {
  getCategoriesForScope,
  getCategoryDefinition,
  getCategoryIcon,
  getCategoryLabel,
  getFallbackCategory,
  isValidCategorySlug,
  resolveCategoryCompatibility,
  resolveLegacyCategory
} from "@/lib/categories/catalog";

describe("category catalog", () => {
  it("restituisce solo categorie compatibili con lo scope richiesto", () => {
    const expenseCategories = getCategoriesForScope("expense");
    const incomeCategories = getCategoriesForScope("income");

    expect(expenseCategories.every((category) => category.scope !== "income")).toBe(true);
    expect(incomeCategories.every((category) => category.scope !== "expense")).toBe(true);
  });

  it("riconosce slug validi e invalida quelli fuori scope", () => {
    expect(isValidCategorySlug("groceries", "expense")).toBe(true);
    expect(isValidCategorySlug("groceries", "income")).toBe(false);
    expect(isValidCategorySlug("salary", "income")).toBe(true);
    expect(isValidCategorySlug("missing-category", "expense")).toBe(false);
  });

  it("risolve label e fallback corretti", () => {
    expect(getCategoryDefinition("transport")?.label).toBe("Trasporti");
    expect(getCategoryLabel("salary", "income")).toBe("Stipendio");
    expect(getCategoryLabel("unknown-slug", "expense")).toBe(getFallbackCategory("expense").label);
    expect(getCategoryIcon("unknown-slug", "expense")).toBe(getFallbackCategory("expense").icon);
  });

  it("mappa categorie legacy comuni e usa altro come fallback", () => {
    expect(resolveLegacyCategory("Supermercato", "expense").slug).toBe("groceries");
    expect(resolveLegacyCategory("stipendio", "income").slug).toBe("salary");
    expect(resolveLegacyCategory("qualcosa di strano", "expense").slug).toBe(
      "other-expense"
    );
  });

  it("normalizza maiuscole, spazi e valori vuoti in modo sicuro", () => {
    expect(resolveCategoryCompatibility("  SUPERmercato  ", "expense")).toMatchObject({
      slug: "groceries",
      displayLabel: "Spesa alimentare",
      canonicalLabel: "Spesa alimentare",
      isLegacyFallback: false,
      wasMatched: true
    });

    expect(resolveCategoryCompatibility("   ", "income")).toMatchObject({
      slug: "other-income",
      displayLabel: "Altro",
      canonicalLabel: "Altro",
      originalLabel: null,
      isLegacyFallback: false,
      wasMatched: false
    });
  });
});
