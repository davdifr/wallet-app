import { describe, expect, it } from "vitest";

import { calculateDailyBudget } from "@/lib/budget/daily-budget";

describe("calculateDailyBudget", () => {
  it("calcola budget residuo e spesa giornaliera consigliata", () => {
    const result = calculateDailyBudget({
      expectedMonthlyIncome: 3000,
      registeredMonthlyExpenses: 1000,
      monthlySavingsTarget: 500,
      currentDate: new Date("2026-03-15T12:00:00Z")
    });

    expect(result.remainingMonthlyBudget).toBe(1500);
    expect(result.daysRemaining).toBe(17);
    expect(result.recommendedDailySpend).toBeCloseTo(88.24, 2);
    expect(result.status).toBe("in_linea");
  });

  it("restituisce attenzione quando la spesa corre piu veloce del piano", () => {
    const result = calculateDailyBudget({
      expectedMonthlyIncome: 3000,
      registeredMonthlyExpenses: 1800,
      monthlySavingsTarget: 500,
      currentDate: new Date("2026-03-15T12:00:00Z")
    });

    expect(result.remainingMonthlyBudget).toBe(700);
    expect(result.recommendedDailySpend).toBeCloseTo(41.18, 2);
    expect(result.status).toBe("attenzione");
  });

  it("gestisce la fine del mese mantenendo almeno un giorno residuo", () => {
    const result = calculateDailyBudget({
      expectedMonthlyIncome: 2000,
      registeredMonthlyExpenses: 1200,
      monthlySavingsTarget: 300,
      currentDate: new Date("2026-02-28T12:00:00Z")
    });

    expect(result.daysRemaining).toBe(1);
    expect(result.recommendedDailySpend).toBe(500);
    expect(result.status).toBe("in_linea");
  });

  it("gestisce nessuna entrata senza generare budget giornaliero positivo", () => {
    const result = calculateDailyBudget({
      expectedMonthlyIncome: 0,
      registeredMonthlyExpenses: 0,
      monthlySavingsTarget: 0,
      currentDate: new Date("2026-03-10T12:00:00Z")
    });

    expect(result.remainingMonthlyBudget).toBe(0);
    expect(result.recommendedDailySpend).toBe(0);
    expect(result.status).toBe("in_linea");
  });

  it("se il target di risparmio e troppo alto segnala fuori budget", () => {
    const result = calculateDailyBudget({
      expectedMonthlyIncome: 1200,
      registeredMonthlyExpenses: 100,
      monthlySavingsTarget: 1500,
      currentDate: new Date("2026-03-10T12:00:00Z")
    });

    expect(result.spendableBudget).toBe(-300);
    expect(result.remainingMonthlyBudget).toBe(-400);
    expect(result.recommendedDailySpend).toBe(0);
    expect(result.status).toBe("fuori_budget");
  });

  it("con saldo negativo va fuori budget", () => {
    const result = calculateDailyBudget({
      expectedMonthlyIncome: 1000,
      registeredMonthlyExpenses: 1300,
      monthlySavingsTarget: 100,
      currentDate: new Date("2026-03-20T12:00:00Z")
    });

    expect(result.remainingMonthlyBudget).toBe(-400);
    expect(result.recommendedDailySpend).toBe(0);
    expect(result.status).toBe("fuori_budget");
  });
});
