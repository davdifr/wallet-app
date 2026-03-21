import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn()
}));

vi.mock("@/services/recurring-incomes/recurring-income-service", () => ({
  materializeRecurringIncomes: vi.fn().mockResolvedValue({
    createdTransactions: 0,
    skippedDuplicates: 0,
    updatedRecurringIncomes: 0
  })
}));

vi.mock("@/services/piggy-bank/piggy-bank-service", () => ({
  getPiggyBankSummary: vi.fn()
}));

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBudgetSnapshot } from "@/services/budget/budget-service";
import { getPiggyBankSummary } from "@/services/piggy-bank/piggy-bank-service";

describe("budget snapshot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("include il saldo del salvadanaio nel patrimonio totale", async () => {
    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "transactions") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => ({
                order: vi.fn(() => ({
                  data: [
                    {
                      id: "income-1",
                      user_id: "user-1",
                      group_id: null,
                      transaction_type: "income",
                      status: "cleared",
                      amount: 1000,
                      currency: "EUR",
                      transaction_date: "2026-03-10",
                      description: "Income · Stipendio · Azienda",
                      category: "Stipendio",
                      merchant: "Azienda",
                      notes: null,
                      is_shared: false,
                      shared_expense_id: null,
                      settlement_id: null,
                      recurring_income_id: null,
                      recurring_income_instance_key: null,
                      recurring_occurrence_date: null,
                      category_slug: "salary",
                      created_at: "2026-03-10T09:00:00.000Z",
                      updated_at: "2026-03-10T09:00:00.000Z"
                    },
                    {
                      id: "expense-1",
                      user_id: "user-1",
                      group_id: null,
                      transaction_type: "expense",
                      status: "cleared",
                      amount: 200,
                      currency: "EUR",
                      transaction_date: "2026-03-11",
                      description: "Expense · Spesa alimentare · Carta",
                      category: "Spesa alimentare",
                      merchant: "Carta",
                      notes: null,
                      is_shared: false,
                      shared_expense_id: null,
                      settlement_id: null,
                      recurring_income_id: null,
                      recurring_income_instance_key: null,
                      recurring_occurrence_date: null,
                      category_slug: "groceries",
                      created_at: "2026-03-11T09:00:00.000Z",
                      updated_at: "2026-03-11T09:00:00.000Z"
                    }
                  ],
                  error: null
                }))
              }))
            }))
          };
        }

        if (table === "recurring_incomes") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                in: vi.fn(() => ({
                  lte: vi.fn().mockResolvedValue({ data: [], error: null })
                }))
              }))
            }))
          };
        }

        if (table === "saving_goals") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({ data: [], error: null })
            }))
          };
        }

        if (table === "goal_contributions") {
          return {
            select: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({ data: [], error: null })
            }))
          };
        }

        throw new Error(`Unexpected table ${table}`);
      })
    };

    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockClient as never);
    vi.mocked(getPiggyBankSummary).mockResolvedValue({
      balance: 300,
      settings: null,
      recentMovements: []
    });

    const snapshot = await getBudgetSnapshot(new Date("2026-03-15T12:00:00.000Z"));

    expect(snapshot.totalWealth).toBe(1100);
    expect(snapshot.piggyBankBalance).toBe(300);
    expect(snapshot.dailyBudget.blockedInPiggyBank).toBe(300);
  });
});