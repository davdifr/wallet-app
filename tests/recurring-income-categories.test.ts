import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn()
}));

import { recurringIncomeSchema } from "@/lib/validations/recurring-income";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createRecurringIncome,
  deleteRecurringIncome,
  listRecurringIncomes,
  materializeRecurringIncomes,
  setRecurringIncomeActiveState
} from "@/services/recurring-incomes/recurring-income-service";

describe("recurring categories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accetta una categoria income valida e rifiuta categorie fuori scope", () => {
    const valid = recurringIncomeSchema.safeParse({
      amount: "1200",
      type: "income",
      categorySlug: "salary",
      description: "Entrata mensile",
      source: "Datore di lavoro",
      frequency: "monthly",
      startsOn: "2026-03-01",
      endsOn: ""
    });

    const invalid = recurringIncomeSchema.safeParse({
      amount: "1200",
      type: "income",
      categorySlug: "groceries",
      description: "Entrata mensile",
      source: "Datore di lavoro",
      frequency: "monthly",
      startsOn: "2026-03-01",
      endsOn: ""
    });

    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);

    if (valid.success) {
      expect(valid.data.category).toBe("Stipendio");
    }
  });

  it("accetta una categoria expense valida e rifiuta categorie income fuori scope", () => {
    const valid = recurringIncomeSchema.safeParse({
      amount: "85",
      type: "expense",
      categorySlug: "subscriptions",
      description: "Streaming",
      source: "Carta",
      frequency: "monthly",
      startsOn: "2026-03-01",
      endsOn: ""
    });

    const invalid = recurringIncomeSchema.safeParse({
      amount: "85",
      type: "expense",
      categorySlug: "salary",
      description: "Streaming",
      source: "Carta",
      frequency: "monthly",
      startsOn: "2026-03-01",
      endsOn: ""
    });

    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });

  it("mappa ricorrenze legacy non riconosciute sul fallback income", async () => {
    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "recurring_incomes") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => ({
                order: vi.fn(() => ({
                  order: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: "income-1",
                        user_id: "user-1",
                        amount: 1000,
                        category: "Vecchia categoria strana",
                        category_slug: null,
                        description: "Entrata",
                        source: "Cliente",
                        frequency: "monthly",
                        starts_on: "2026-03-01",
                        ends_on: null,
                        next_occurrence_on: "2026-04-01",
                        is_active: true,
                        currency: "EUR",
                        created_at: "2026-03-01T00:00:00.000Z"
                      }
                    ],
                    error: null
                  })
                }))
              }))
            }))
          };
        }

        throw new Error(`Unexpected table ${table}`);
      })
    };

    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockClient as never);

    const recurringIncomes = await listRecurringIncomes();

    expect(recurringIncomes[0]?.categorySlug).toBe("other-income");
    expect(recurringIncomes[0]?.isLegacyCategoryFallback).toBe(true);
  });

  it("crea una ricorrenza con categoria canonica coerente col catalogo", async () => {
    const insertSpy = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: {
            id: "income-created",
            user_id: "user-1",
            amount: 1200,
            category: "Stipendio",
            category_slug: "salary",
            description: "Entrata mensile",
            source: "Datore di lavoro",
            frequency: "monthly",
            starts_on: "2026-03-01",
            ends_on: null,
            next_occurrence_on: "2026-03-01",
            is_active: true,
            currency: "EUR",
            created_at: "2026-03-01T00:00:00.000Z"
          },
          error: null
        })
      }))
    }));

    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "recurring_incomes") {
          return {
            insert: insertSpy
          };
        }

        throw new Error(`Unexpected table ${table}`);
      })
    };

    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockClient as never);

    const recurringIncome = await createRecurringIncome("user-1", {
      amount: "1200",
      type: "income",
      categorySlug: "salary",
      category: "Stipendio",
      description: "Entrata mensile",
      source: "Datore di lavoro",
      frequency: "monthly",
      startsOn: "2026-03-01",
      endsOn: ""
    });

    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "Stipendio",
        category_slug: "salary",
        frequency: "monthly",
        transaction_type: "income"
      })
    );
    expect(recurringIncome.categorySlug).toBe("salary");
    expect(recurringIncome.category).toBe("Stipendio");
  });

  it("materializza una spesa ricorrente come expense", async () => {
    const insertSpy = vi.fn().mockResolvedValue({ error: null });
    const updateSpy = vi.fn().mockResolvedValue({ error: null });

    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "recurring_incomes") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                in: vi.fn(() => ({
                  lte: vi.fn(() => ({
                    order: vi.fn().mockResolvedValue({
                      data: [
                        {
                          id: "expense-1",
                          user_id: "user-1",
                          amount: 19.99,
                          transaction_type: "expense",
                          category: "Spotify",
                          category_slug: null,
                          description: "Musica",
                          source: "Carta",
                          frequency: "monthly",
                          starts_on: "2026-03-01",
                          ends_on: null,
                          next_occurrence_on: "2026-03-01",
                          is_active: true,
                          currency: "EUR",
                          created_at: "2026-03-01T00:00:00.000Z"
                        }
                      ],
                      error: null
                    })
                  }))
                }))
              }))
            })),
            update: vi.fn(() => ({
              eq: updateSpy
            }))
          };
        }

        if (table === "transactions") {
          return {
            insert: insertSpy
          };
        }

        throw new Error(`Unexpected table ${table}`);
      })
    };

    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockClient as never);

    const result = await materializeRecurringIncomes(new Date("2026-03-19T10:00:00.000Z"));

    expect(result.createdTransactions).toBe(1);
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        category_slug: "subscriptions",
        transaction_type: "expense"
      })
    );
  });

  it("materializza transazioni con categoria canonica coerente e mantiene la deduplica invariata", async () => {
    const insertSpy = vi.fn().mockResolvedValue({ error: null });
    const updateSpy = vi.fn().mockResolvedValue({ error: null });

    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "recurring_incomes") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                in: vi.fn(() => ({
                  lte: vi.fn(() => ({
                    order: vi.fn().mockResolvedValue({
                      data: [
                        {
                          id: "income-1",
                          user_id: "user-1",
                          amount: 1500,
                          category: "busta paga",
                          category_slug: null,
                          description: "Mensile",
                          source: "Azienda",
                          frequency: "monthly",
                          starts_on: "2026-03-01",
                          ends_on: null,
                          next_occurrence_on: "2026-03-01",
                          is_active: true,
                          currency: "EUR",
                          created_at: "2026-03-01T00:00:00.000Z"
                        }
                      ],
                      error: null
                    })
                  }))
                }))
              })),
              update: undefined
            })),
            update: vi.fn(() => ({
              eq: updateSpy
            }))
          };
        }

        if (table === "transactions") {
          return {
            insert: insertSpy
          };
        }

        throw new Error(`Unexpected table ${table}`);
      })
    };

    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockClient as never);

    const result = await materializeRecurringIncomes(new Date("2026-03-19T10:00:00.000Z"));

    expect(result.createdTransactions).toBe(1);
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "Stipendio",
        category_slug: "salary",
        recurring_income_instance_key: "income-1:2026-03-01",
        transaction_type: "income"
      })
    );
    expect(updateSpy).toHaveBeenCalledWith("id", "income-1");
  });

  it("toggle attivo/disattivo continua a funzionare con categoria mappata", async () => {
    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "recurring_incomes") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: "income-1",
                      user_id: "user-1",
                      amount: 300,
                      category: "Bonus",
                      category_slug: null,
                      description: "Premio",
                      source: "Azienda",
                      frequency: "monthly",
                      starts_on: "2026-03-01",
                      ends_on: null,
                      next_occurrence_on: "2026-04-01",
                      is_active: true,
                      currency: "EUR",
                      created_at: "2026-03-01T00:00:00.000Z"
                    },
                    error: null
                  })
                }))
              }))
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  select: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: "income-1",
                        user_id: "user-1",
                        amount: 300,
                        category: "Bonus",
                        category_slug: null,
                        description: "Premio",
                        source: "Azienda",
                        frequency: "monthly",
                        starts_on: "2026-03-01",
                        ends_on: null,
                        next_occurrence_on: "2026-04-01",
                        is_active: false,
                        currency: "EUR",
                        created_at: "2026-03-01T00:00:00.000Z"
                      },
                      error: null
                    })
                  }))
                }))
              }))
            }))
          };
        }

        throw new Error(`Unexpected table ${table}`);
      })
    };

    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockClient as never);

    const recurringIncome = await setRecurringIncomeActiveState("user-1", "income-1", false);

    expect(recurringIncome.categorySlug).toBe("bonus");
    expect(recurringIncome.isActive).toBe(false);
  });

  it("delete continua a restituire una ricorrenza leggibile anche se legacy", async () => {
    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "recurring_incomes") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: "income-legacy",
                      user_id: "user-1",
                      amount: 300,
                      category: "Entrata sconosciuta",
                      category_slug: null,
                      description: "Premio",
                      source: "Azienda",
                      frequency: "monthly",
                      starts_on: "2026-03-01",
                      ends_on: null,
                      next_occurrence_on: "2026-04-01",
                      is_active: true,
                      currency: "EUR",
                      created_at: "2026-03-01T00:00:00.000Z"
                    },
                    error: null
                  })
                }))
              }))
            })),
            delete: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn().mockResolvedValue({
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

    const recurringIncome = await deleteRecurringIncome("user-1", "income-legacy");

    expect(recurringIncome).toMatchObject({
      category: "Entrata sconosciuta",
      categorySlug: "other-income",
      isLegacyCategoryFallback: true
    });
  });
});
