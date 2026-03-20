import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn()
}));

vi.mock("@/services/budget/budget-service", () => ({
  getBudgetSnapshot: vi.fn().mockResolvedValue({
    goalProtectionById: {}
  })
}));

import { calculateSavingGoalMetrics } from "@/lib/saving-goals/calculations";
import { sortSavingGoals } from "@/lib/saving-goals/sorting";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBudgetSnapshot } from "@/services/budget/budget-service";
import {
  addGoalContribution,
  createSavingGoal,
  deleteSavingGoal
} from "@/services/saving-goals/saving-goals-service";
import type { SavingGoal } from "@/types/saving-goals";

function buildGoal(overrides: Partial<SavingGoal> = {}): SavingGoal {
  return {
    id: "goal-1",
    title: "Fondo emergenza",
    description: "",
    targetAmount: 1200,
    targetDate: null,
    savedSoFar: 300,
    priority: "medium",
    createdAt: "2026-03-01T00:00:00.000Z",
    contributions: [
      { id: "c-1", amount: 100, contributionDate: "2026-01-10", note: "" },
      { id: "c-2", amount: 200, contributionDate: "2026-02-10", note: "" }
    ],
    protectionPreviewAmount: 90,
    monthlyAllocableAmount: 90,
    ...overrides
  };
}

describe("saving goal calculations", () => {
  it("gestisce goal senza target date", () => {
    const metrics = calculateSavingGoalMetrics(buildGoal(), new Date("2026-03-18T12:00:00Z"));

    expect(metrics.remainingAmount).toBe(900);
    expect(metrics.totalManualContributionAmount).toBe(300);
    expect(metrics.monthlyAllocableAmount).toBe(90);
    expect(metrics.monthlyContributionNeeded).toBe(75);
    expect(metrics.estimatedMonthsToReach).toBe(10);
    expect(metrics.healthStatus).toBe("in_linea");
  });

  it("gestisce goal gia completato", () => {
    const metrics = calculateSavingGoalMetrics(
      buildGoal({
        savedSoFar: 1200,
        contributions: [{ id: "c-1", amount: 1200, contributionDate: "2026-01-10", note: "" }]
      }),
      new Date("2026-03-18T12:00:00Z")
    );

    expect(metrics.progressPercentage).toBe(100);
    expect(metrics.remainingAmount).toBe(0);
    expect(metrics.healthStatus).toBe("completato");
  });

  it("distingue priorita alta e bassa nell'ordinamento con piu goal concorrenti", () => {
    const ordered = sortSavingGoals([
      buildGoal({
        id: "low",
        priority: "low",
        monthlyAllocableAmount: 40,
        protectionPreviewAmount: 40
      }),
      buildGoal({
        id: "high-slow",
        priority: "high",
        savedSoFar: 100,
        contributions: [{ id: "c1", amount: 100, contributionDate: "2026-01-10", note: "" }],
        monthlyAllocableAmount: 120,
        protectionPreviewAmount: 120
      }),
      buildGoal({
        id: "high-fast",
        priority: "high",
        savedSoFar: 900,
        contributions: [
          { id: "c1", amount: 300, contributionDate: "2026-01-10", note: "" },
          { id: "c2", amount: 300, contributionDate: "2026-02-10", note: "" },
          { id: "c3", amount: 300, contributionDate: "2026-03-10", note: "" }
        ],
        monthlyAllocableAmount: 100,
        protectionPreviewAmount: 100
      })
    ]);

    expect(ordered.map((goal) => goal.id)).toEqual(["high-fast", "high-slow", "low"]);
  });

  it("se non c'e capacita allocabile espone goal bloccato", () => {
    const metrics = calculateSavingGoalMetrics(
      buildGoal({
        savedSoFar: 0,
        contributions: [],
        monthlyAllocableAmount: 0,
        protectionPreviewAmount: 0
      }),
      new Date("2026-03-18T12:00:00Z")
    );

    expect(metrics.monthlyAllocableAmount).toBe(0);
    expect(metrics.healthStatus).toBe("bloccato");
  });

  it("senza storico non usa il residuo intero come quota mensile", () => {
    const metrics = calculateSavingGoalMetrics(
      buildGoal({
        savedSoFar: 0,
        targetAmount: 1200,
        contributions: [],
        monthlyAllocableAmount: 100,
        protectionPreviewAmount: 100
      }),
      new Date("2026-03-18T12:00:00Z")
    );

    expect(metrics.monthlyContributionNeeded).toBe(100);
    expect(metrics.estimatedMonthsToReach).toBe(12);
    expect(metrics.healthStatus).toBe("in_linea");
  });

  it("non lascia che un accantonamento iniziale falsi il ritmo futuro", () => {
    const metrics = calculateSavingGoalMetrics(
      buildGoal({
        targetAmount: 2000,
        savedSoFar: 600,
        contributions: [{ id: "c1", amount: 600, contributionDate: "2026-03-10", note: "" }],
        monthlyAllocableAmount: 100,
        protectionPreviewAmount: 100
      }),
      new Date("2026-03-18T12:00:00Z")
    );

    expect(metrics.averageMonthlySaved).toBe(200);
    expect(metrics.monthlyContributionNeeded).toBeCloseTo(116.67, 2);
    expect(metrics.estimatedMonthsToReach).toBe(14);
    expect(metrics.healthStatus).toBe("lento");
  });

  it("usa la target date per calcolare la quota mensile necessaria", () => {
    const metrics = calculateSavingGoalMetrics(
      buildGoal({
        savedSoFar: 300,
        targetDate: "2026-05-31",
        monthlyAllocableAmount: 200,
        protectionPreviewAmount: 200
      }),
      new Date("2026-03-18T12:00:00Z")
    );

    expect(metrics.monthlyContributionNeeded).toBe(300);
    expect(metrics.estimatedMonthsToReach).toBe(5);
    expect(metrics.healthStatus).toBe("lento");
  });

  it("aggiorna le metriche dopo contributi manuali successivi", () => {
    const before = calculateSavingGoalMetrics(
      buildGoal({
        savedSoFar: 100,
        contributions: [{ id: "c1", amount: 100, contributionDate: "2026-01-10", note: "" }]
      }),
      new Date("2026-03-18T12:00:00Z")
    );
    const after = calculateSavingGoalMetrics(
      buildGoal({
        savedSoFar: 400,
        contributions: [
          { id: "c1", amount: 100, contributionDate: "2026-01-10", note: "" },
          { id: "c2", amount: 300, contributionDate: "2026-03-10", note: "" }
        ]
      }),
      new Date("2026-03-18T12:00:00Z")
    );

    expect(after.progressPercentage).toBeGreaterThan(before.progressPercentage);
    expect(after.remainingAmount).toBeLessThan(before.remainingAmount);
    expect(after.totalManualContributionAmount).toBe(400);
  });
});

describe("saving goals service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("crea un goal senza target date e salva null nel database", async () => {
    const insertSpy = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: "goal-2",
            user_id: "user-1",
            title: "Viaggio",
            description: null,
            target_amount: 1500,
            target_date: null,
            saved_so_far: 0,
            currency: "EUR",
            priority: "medium",
            status: "active",
            created_at: "2026-03-01T00:00:00.000Z",
            updated_at: "2026-03-01T00:00:00.000Z"
          },
          error: null
        })
      })
    });

    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "saving_goals") {
          return {
            insert: insertSpy
          };
        }

        throw new Error(`Unexpected table ${table}`);
      })
    };

    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockClient as never);

    const result = await createSavingGoal("user-1", {
      title: "Viaggio",
      description: "",
      targetAmount: "1500",
      targetDate: "",
      priority: "medium"
    });

    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        target_date: null,
        saved_so_far: 0
      })
    );
    expect(result.targetDate).toBeNull();
  });

  it("elimina un goal anche se esistono contribution collegate", async () => {
    const goalRow = {
      id: "goal-1",
      user_id: "user-1",
      title: "Goal",
      description: "desc",
      target_amount: 1000,
      saved_so_far: 200,
      currency: "EUR",
      priority: "high",
      target_date: null,
      status: "active",
      created_at: "2026-03-01T00:00:00.000Z",
      updated_at: "2026-03-01T00:00:00.000Z"
    };

    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "saving_goals") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({ data: goalRow, error: null })
                }))
              }))
            })),
            delete: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn().mockResolvedValue({ error: null })
              }))
            }))
          };
        }

        throw new Error(`Unexpected table ${table}`);
      })
    };

    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockClient as never);

    const result = await deleteSavingGoal("user-1", "goal-1");

    expect(result.id).toBe("goal-1");
    expect(result.title).toBe("Goal");
    expect(result.contributions).toEqual([]);
  });

  it("aggiorna saved_so_far e completa il goal dopo un contributo manuale", async () => {
    const goalRow = {
      id: "goal-1",
      user_id: "user-1",
      title: "Goal",
      description: "desc",
      target_amount: 1000,
      saved_so_far: 800,
      currency: "EUR",
      priority: "high",
      target_date: null,
      status: "active",
      created_at: "2026-03-01T00:00:00.000Z",
      updated_at: "2026-03-01T00:00:00.000Z"
    };
    const updatedGoalRow = {
      ...goalRow,
      saved_so_far: 1000,
      status: "completed"
    };
    const contributionRow = {
      id: "contribution-1",
      goal_id: "goal-1",
      user_id: "user-1",
      amount: 200,
      contribution_date: "2026-03-18",
      note: "Bonus"
    };

    const updateSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null })
    });
    const insertContributionSpy = vi.fn().mockResolvedValue({ error: null });
    let savingGoalSelectCount = 0;

    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "saving_goals") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => {
                savingGoalSelectCount += 1;

                if (savingGoalSelectCount === 1) {
                  return {
                    eq: vi.fn(() => ({
                      single: vi.fn().mockResolvedValue({ data: goalRow, error: null })
                    }))
                  };
                }

                return {
                  single: vi.fn().mockResolvedValue({ data: updatedGoalRow, error: null })
                };
              })
            })),
            update: updateSpy
          };
        }

        if (table === "goal_contributions") {
          return {
            insert: insertContributionSpy,
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn().mockResolvedValue({
                  data: [contributionRow],
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
    vi.mocked(getBudgetSnapshot).mockResolvedValue({
      goalProtectionById: { "goal-1": 150 }
    } as never);

    const result = await addGoalContribution("user-1", {
      goalId: "goal-1",
      amount: "200",
      note: "Bonus"
    });

    expect(insertContributionSpy).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        saved_so_far: 1000,
        status: "completed"
      })
    );
    expect(result.savedSoFar).toBe(1000);
    expect(result.monthlyAllocableAmount).toBe(150);
    expect(result.contributions).toHaveLength(1);
  });
});
