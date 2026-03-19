import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn()
}));

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createTransaction,
  getTransactionById,
  listTransactionCategories,
  listTransactions,
  updateTransaction
} from "@/services/transactions/transactions-service";

describe("transaction categories integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("crea una transazione con categoria canonica coerente col catalogo", async () => {
    const insertSpy = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
            data: {
              id: "transaction-1",
              amount: 42,
              transaction_date: "2026-03-19",
              category: "Spesa alimentare",
              category_slug: "groceries",
              notes: "",
              merchant: "Carta",
            description: "Expense · Spesa alimentare · Carta",
            transaction_type: "expense",
            created_at: "2026-03-19T10:00:00.000Z"
          },
          error: null
        })
      }))
    }));

    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "transactions") {
          return {
            insert: insertSpy
          };
        }

        throw new Error(`Unexpected table ${table}`);
      })
    };

    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockClient as never);

    const transaction = await createTransaction("user-1", {
      amount: "42",
      date: "2026-03-19",
      categorySlug: "groceries",
      category: "Spesa alimentare",
      note: "",
      source: "Carta",
      type: "expense"
    });

    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "Spesa alimentare",
        category_slug: "groceries",
        transaction_type: "expense"
      })
    );
    expect(transaction.category).toBe("Spesa alimentare");
    expect(transaction.categorySlug).toBe("groceries");
  });

  it("aggiorna una transazione mantenendo la categoria canonica", async () => {
    const updateSpy = vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: {
              id: "transaction-1",
              amount: 1800,
              transaction_date: "2026-03-19",
              category: "Stipendio",
              category_slug: "salary",
              notes: "Bonifico",
              merchant: "Azienda",
              description: "Income · Stipendio · Azienda",
              transaction_type: "income",
              created_at: "2026-03-19T10:00:00.000Z"
            },
            error: null
          })
        }))
      }))
    }));

    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "transactions") {
          return {
            update: updateSpy
          };
        }

        throw new Error(`Unexpected table ${table}`);
      })
    };

    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockClient as never);

    const transaction = await updateTransaction("transaction-1", {
      amount: "1800",
      date: "2026-03-19",
      categorySlug: "salary",
      category: "Stipendio",
      note: "Bonifico",
      source: "Azienda",
      type: "income"
    });

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "Stipendio",
        category_slug: "salary",
        transaction_type: "income"
      })
    );
    expect(transaction.categorySlug).toBe("salary");
    expect(transaction.category).toBe("Stipendio");
  });

  it("mantiene leggibile un record legacy non mappato in edit", async () => {
    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "transactions") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "transaction-legacy",
                    amount: 25,
                    transaction_date: "2026-03-19",
                    category: "Categoria storica strana",
                    category_slug: null,
                    notes: "",
                    merchant: "Contanti",
                    description: "Expense · Categoria storica strana · Contanti",
                    transaction_type: "expense",
                    created_at: "2026-03-19T10:00:00.000Z"
                  },
                  error: null
                })
              }))
            }))
          };
        }

        throw new Error(`Unexpected table ${table}`);
      })
    };

    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockClient as never);

    const transaction = await getTransactionById("transaction-legacy");

    expect(transaction).toMatchObject({
      category: "Categoria storica strana",
      categorySlug: "other-expense",
      isLegacyCategoryFallback: true
    });
  });

  it("normalizza i filtri categoria e mantiene una voce legacy dedicata", async () => {
    const rows = [
      {
        id: "transaction-1",
        amount: 30,
        transaction_date: "2026-03-19",
        category: "SUPERmercato",
        category_slug: null,
        notes: "",
        merchant: "Carta",
        description: "Expense · SUPERmercato · Carta",
        transaction_type: "expense",
        created_at: "2026-03-19T10:00:00.000Z"
      },
      {
        id: "transaction-2",
        amount: 18,
        transaction_date: "2026-03-18",
        category: "Vecchia roba",
        category_slug: null,
        notes: "",
        merchant: "Contanti",
        description: "Expense · Vecchia roba · Contanti",
        transaction_type: "expense",
        created_at: "2026-03-18T10:00:00.000Z"
      },
      {
        id: "transaction-3",
        amount: 1200,
        transaction_date: "2026-03-17",
        category: "salary",
        category_slug: null,
        notes: "",
        merchant: "Azienda",
        description: "Income · salary · Azienda",
        transaction_type: "income",
        created_at: "2026-03-17T10:00:00.000Z"
      }
    ];

    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "transactions") {
          return {
            select: vi.fn((selection: string) => {
              if (selection === "category, transaction_type") {
                return {
                  in: vi.fn(() => ({
                    not: vi.fn(() => ({
                      order: vi.fn(() => ({
                        order: vi.fn().mockResolvedValue({
                          data: rows.map((row) => ({
                            category: row.category,
                            transaction_type: row.transaction_type
                          })),
                          error: null
                        })
                      }))
                    }))
                  }))
                };
              }

              return {
                in: vi.fn(() => ({
                  order: vi.fn(() => ({
                    order: vi.fn().mockResolvedValue({
                      data: rows,
                      error: null
                    })
                  }))
                }))
              };
            })
          };
        }

        throw new Error(`Unexpected table ${table}`);
      })
    };

    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockClient as never);

    const categories = await listTransactionCategories();
    const groceriesOption = categories.find((item) => item.value === "groceries");
    const legacyOption = categories.find((item) => item.isLegacy);

    expect(groceriesOption).toMatchObject({
      label: "Spesa alimentare",
      categorySlug: "groceries",
      isLegacy: false
    });
    expect(legacyOption).toMatchObject({
      label: "Vecchia roba",
      categorySlug: "other-expense",
      isLegacy: true
    });

    const groceriesTransactions = await listTransactions({ category: "groceries" });
    const legacyTransactions = await listTransactions({ category: legacyOption?.value });

    expect(groceriesTransactions).toHaveLength(1);
    expect(groceriesTransactions[0]?.category).toBe("Spesa alimentare");
    expect(legacyTransactions).toHaveLength(1);
    expect(legacyTransactions[0]?.category).toBe("Vecchia roba");
  });
});
