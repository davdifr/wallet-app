import { describe, expect, it } from "vitest";

import { calculateDailyBudget } from "@/lib/budget/daily-budget";

describe("calculateDailyBudget", () => {
  it("gestisce un mese vuoto", () => {
    const result = calculateDailyBudget({
      registeredMonthlyIncome: 0,
      projectedRecurringIncome: 0,
      projectedRecurringExpenses: 0,
      registeredMonthlyExpenses: 0,
      piggyBankBalance: 0,
      averageMonthlyExpenses: 0,
      goals: [],
      currentDate: new Date("2026-03-10T12:00:00Z")
    });

    expect(result.dailyBudget).toBe(0);
    expect(result.remainingMonthlyBudget).toBe(0);
    expect(result.warnings.insufficientLiquidity).toBe(true);
  });

  it("considera ricorrenze future entro fine mese", () => {
    const result = calculateDailyBudget({
      registeredMonthlyIncome: 1000,
      projectedRecurringIncome: 500,
      projectedRecurringExpenses: 0,
      registeredMonthlyExpenses: 200,
      piggyBankBalance: 0,
      averageMonthlyExpenses: 600,
      goals: [],
      currentDate: new Date("2026-03-15T12:00:00Z")
    });

    expect(result.projectedRecurringIncome).toBe(500);
    expect(result.monthlyAvailableLiquidity).toBe(1300);
    expect(result.remainingMonthReserve).toBe(400);
    expect(result.dailyBudget).toBeCloseTo(52.94, 2);
    expect(result.status).toBe("in_linea");
  });

  it("gestisce un salvadanaio pieno escludendolo dallo spendibile", () => {
    const result = calculateDailyBudget({
      registeredMonthlyIncome: 1000,
      projectedRecurringIncome: 0,
      projectedRecurringExpenses: 0,
      registeredMonthlyExpenses: 100,
      piggyBankBalance: 900,
      averageMonthlyExpenses: 400,
      goals: [],
      currentDate: new Date("2026-03-15T12:00:00Z")
    });

    expect(result.blockedInPiggyBank).toBe(900);
    expect(result.dailyBudget).toBe(0);
    expect(result.warnings.negativeBudget).toBe(true);
    expect(result.status).toBe("fuori_budget");
  });

  it("distribuisce la quota teorica tra goal multipli con pesi diversi", () => {
    const result = calculateDailyBudget({
      registeredMonthlyIncome: 3000,
      projectedRecurringIncome: 0,
      projectedRecurringExpenses: 0,
      registeredMonthlyExpenses: 1000,
      piggyBankBalance: 200,
      averageMonthlyExpenses: 1500,
      goals: [
        { goalId: "goal-high", reserveTarget: 300, weight: 3 },
        { goalId: "goal-low", reserveTarget: 100, weight: 1 }
      ],
      currentDate: new Date("2026-03-15T12:00:00Z")
    });

    expect(result.protectedForGoals).toBe(400);
    expect(result.goalAllocations).toEqual([
      { goalId: "goal-high", protectedAmount: 300, unmetAmount: 0 },
      { goalId: "goal-low", protectedAmount: 100, unmetAmount: 0 }
    ]);
    expect(result.dailyBudget).toBeCloseTo(52.94, 2);
  });

  it("funziona senza goal attivi", () => {
    const result = calculateDailyBudget({
      registeredMonthlyIncome: 1500,
      projectedRecurringIncome: 200,
      projectedRecurringExpenses: 0,
      registeredMonthlyExpenses: 500,
      piggyBankBalance: 100,
      averageMonthlyExpenses: 900,
      goals: [],
      currentDate: new Date("2026-03-15T12:00:00Z")
    });

    expect(result.protectedForGoals).toBe(0);
    expect(result.remainingMonthlyBudget).toBe(700);
    expect(result.dailyBudget).toBeCloseTo(41.18, 2);
  });

  it("se lo storico degli ultimi 3 mesi e molto alto aumenta la quota prudenziale", () => {
    const result = calculateDailyBudget({
      registeredMonthlyIncome: 2000,
      projectedRecurringIncome: 0,
      projectedRecurringExpenses: 0,
      registeredMonthlyExpenses: 500,
      piggyBankBalance: 0,
      averageMonthlyExpenses: 2500,
      goals: [],
      currentDate: new Date("2026-03-15T12:00:00Z")
    });

    expect(result.prudentialReserve).toBe(2500);
    expect(result.remainingMonthReserve).toBe(2000);
    expect(result.dailyBudget).toBe(0);
    expect(result.warnings.negativeBudget).toBe(true);
  });

  it("se i goal sono sottofinanziati segnala warning dedicato", () => {
    const result = calculateDailyBudget({
      registeredMonthlyIncome: 1200,
      projectedRecurringIncome: 0,
      projectedRecurringExpenses: 0,
      registeredMonthlyExpenses: 700,
      piggyBankBalance: 0,
      averageMonthlyExpenses: 900,
      goals: [
        { goalId: "goal-1", reserveTarget: 300, weight: 3 },
        { goalId: "goal-2", reserveTarget: 200, weight: 1 }
      ],
      currentDate: new Date("2026-03-15T12:00:00Z")
    });

    expect(result.protectedForGoals).toBe(300);
    expect(result.warnings.underfundedGoals).toBe(true);
    expect(result.status).toBe("attenzione");
  });

  it("a fine mese divide sul numero corretto di giorni residui", () => {
    const result = calculateDailyBudget({
      registeredMonthlyIncome: 2000,
      projectedRecurringIncome: 0,
      projectedRecurringExpenses: 0,
      registeredMonthlyExpenses: 1200,
      piggyBankBalance: 100,
      averageMonthlyExpenses: 1500,
      goals: [],
      currentDate: new Date("2026-03-30T12:00:00Z")
    });

    expect(result.daysRemaining).toBe(2);
    expect(result.remainingMonthlyBudget).toBe(400);
    expect(result.dailyBudget).toBe(200);
  });

  it("nell'ultimo giorno del mese usa un solo giorno residuo", () => {
    const result = calculateDailyBudget({
      registeredMonthlyIncome: 2000,
      projectedRecurringIncome: 0,
      projectedRecurringExpenses: 0,
      registeredMonthlyExpenses: 1200,
      piggyBankBalance: 100,
      averageMonthlyExpenses: 1500,
      goals: [],
      currentDate: new Date("2026-03-31T12:00:00Z")
    });

    expect(result.daysRemaining).toBe(1);
    expect(result.dailyBudget).toBe(400);
    expect(result.explanation).toContain("1 giorni residui");
  });

  it("sottrae le spese ricorrenti future dalla liquidita del mese", () => {
    const result = calculateDailyBudget({
      registeredMonthlyIncome: 1500,
      projectedRecurringIncome: 0,
      projectedRecurringExpenses: 300,
      registeredMonthlyExpenses: 500,
      piggyBankBalance: 0,
      averageMonthlyExpenses: 700,
      goals: [],
      currentDate: new Date("2026-03-15T12:00:00Z")
    });

    expect(result.projectedRecurringExpenses).toBe(300);
    expect(result.monthlyAvailableLiquidity).toBe(700);
  });
});
