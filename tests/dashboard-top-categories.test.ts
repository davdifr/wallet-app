import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn()
}));

vi.mock("@/services/budget/budget-service", () => ({
  getBudgetSnapshot: vi.fn()
}));

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBudgetSnapshot } from "@/services/budget/budget-service";
import { getDashboardData } from "@/services/dashboard/dashboard-service";

describe("dashboard top categories compatibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aggrega categorie legacy e canoniche senza frammentare la dashboard", async () => {
    vi.mocked(getBudgetSnapshot).mockResolvedValue({
      totalWealth: 3000,
      registeredMonthlyIncome: 1200,
      spentThisMonth: 100,
      projectedRecurringIncome: 0,
      averageMonthlyExpenses: 200,
      piggyBankBalance: 50,
      piggyBankSummary: {
        balance: 50,
        settings: null,
        movements: []
      },
      goalProtectionById: {},
      dailyBudget: {
        dailyBudget: 45,
        daysRemaining: 12,
        monthlyAvailableLiquidity: 900,
        prudentialReserve: 200,
        remainingMonthReserve: 100,
        protectedForGoals: 80,
        goalCapacity: 120,
        blockedInPiggyBank: 50,
        remainingMonthlyBudget: 720,
        explanation: "test",
        warnings: {
          negativeBudget: false,
          underfundedGoals: false,
          insufficientLiquidity: false
        }
      }
    } as never);

    const transactions = [
      {
        id: "tx-1",
        amount: 35,
        transaction_date: "2026-03-19",
        category: "Supermercato",
        category_slug: null,
        notes: null,
        merchant: "Carta",
        description: "Expense · Supermercato · Carta",
        transaction_type: "expense",
        currency: "EUR",
        recurring_income_id: null,
        recurring_occurrence_date: null,
        recurring_income_instance_key: null,
        created_at: "2026-03-19T10:00:00.000Z"
      },
      {
        id: "tx-2",
        amount: 15,
        transaction_date: "2026-03-18",
        category: "Spesa alimentare",
        category_slug: null,
        notes: null,
        merchant: "Carta",
        description: "Expense · Spesa alimentare · Carta",
        transaction_type: "expense",
        currency: "EUR",
        recurring_income_id: null,
        recurring_occurrence_date: null,
        recurring_income_instance_key: null,
        created_at: "2026-03-18T10:00:00.000Z"
      },
      {
        id: "tx-3",
        amount: 20,
        transaction_date: "2026-03-17",
        category: "Voce strana storica",
        category_slug: null,
        notes: null,
        merchant: "Contanti",
        description: "Expense · Voce strana storica · Contanti",
        transaction_type: "expense",
        currency: "EUR",
        recurring_income_id: null,
        recurring_occurrence_date: null,
        recurring_income_instance_key: null,
        created_at: "2026-03-17T10:00:00.000Z"
      },
      {
        id: "tx-4",
        amount: 1200,
        transaction_date: "2026-03-17",
        category: "Stipendio",
        category_slug: null,
        notes: null,
        merchant: "Azienda",
        description: "Income · Stipendio · Azienda",
        transaction_type: "income",
        currency: "EUR",
        recurring_income_id: null,
        recurring_occurrence_date: null,
        recurring_income_instance_key: null,
        created_at: "2026-03-17T10:00:00.000Z"
      }
    ];

    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "transactions") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => ({
                gte: vi.fn(() => ({
                  lte: vi.fn(() => ({
                    order: vi.fn(() => ({
                      order: vi.fn().mockResolvedValue({
                        data: transactions,
                        error: null
                      })
                    }))
                  }))
                }))
              }))
            }))
          };
        }

        if (table === "saving_goals") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => ({
                order: vi.fn(() => ({
                  order: vi.fn().mockResolvedValue({
                    data: [],
                    error: null
                  })
                }))
              }))
            }))
          };
        }

        if (table === "goal_contributions") {
          return {
            select: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null
              })
            }))
          };
        }

        throw new Error(`Unexpected table ${table}`);
      })
    };

    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockClient as never);

    const data = await getDashboardData(new Date("2026-03-19T12:00:00.000Z"));

    expect(data.topCategories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Spesa alimentare",
          value: 50,
          categorySlug: "groceries",
          isLegacyFallback: false
        }),
        expect.objectContaining({
          name: "Altro",
          value: 20,
          categorySlug: "other-expense",
          isLegacyFallback: true
        })
      ])
    );
  });
});
