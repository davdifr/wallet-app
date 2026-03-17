export type DailyBudgetStatus = "in_linea" | "attenzione" | "fuori_budget";

export type DailyBudgetInput = {
  expectedMonthlyIncome: number;
  registeredMonthlyExpenses: number;
  monthlySavingsTarget: number;
  currentDate: Date;
};

export type DailyBudgetResult = {
  remainingMonthlyBudget: number;
  recommendedDailySpend: number;
  status: DailyBudgetStatus;
  daysInMonth: number;
  daysRemaining: number;
  daysElapsed: number;
  spendableBudget: number;
  idealDailySpend: number;
  idealSpentToDate: number;
  varianceToDate: number;
};

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function getMonthMeta(currentDate: Date) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const currentDay = currentDate.getDate();
  const normalizedDay = Math.min(Math.max(currentDay, 1), daysInMonth);
  const daysElapsed = normalizedDay;
  const daysRemaining = Math.max(daysInMonth - normalizedDay + 1, 1);

  return {
    daysElapsed,
    daysInMonth,
    daysRemaining
  };
}

export function calculateDailyBudget(input: DailyBudgetInput): DailyBudgetResult {
  const expectedMonthlyIncome = Math.max(input.expectedMonthlyIncome, 0);
  const registeredMonthlyExpenses = Math.max(input.registeredMonthlyExpenses, 0);
  const monthlySavingsTarget = Math.max(input.monthlySavingsTarget, 0);

  const { daysElapsed, daysInMonth, daysRemaining } = getMonthMeta(input.currentDate);

  // Formula:
  // 1. budget spendibile mese = entrate previste - target di risparmio
  // 2. budget residuo = budget spendibile - spese gia registrate
  // 3. spesa giornaliera consigliata = budget residuo / giorni rimanenti
  // 4. stato = confronto tra spesa reale e ritmo ideale distribuito sul mese
  const spendableBudget = expectedMonthlyIncome - monthlySavingsTarget;
  const remainingMonthlyBudget = spendableBudget - registeredMonthlyExpenses;
  const idealDailySpend =
    daysInMonth > 0 ? Math.max(spendableBudget, 0) / daysInMonth : 0;
  const idealSpentToDate = idealDailySpend * daysElapsed;
  const varianceToDate = registeredMonthlyExpenses - idealSpentToDate;
  const recommendedDailySpend =
    remainingMonthlyBudget <= 0 ? 0 : remainingMonthlyBudget / daysRemaining;

  let status: DailyBudgetStatus = "in_linea";

  if (remainingMonthlyBudget < 0 || spendableBudget < 0) {
    status = "fuori_budget";
  } else if (spendableBudget === 0 && registeredMonthlyExpenses > 0) {
    status = "fuori_budget";
  } else if (
    varianceToDate > Math.max(idealDailySpend * 3, spendableBudget * 0.1) ||
    (recommendedDailySpend > 0 && idealDailySpend > 0 && recommendedDailySpend < idealDailySpend * 0.75)
  ) {
    status = "attenzione";
  }

  return {
    remainingMonthlyBudget: roundCurrency(remainingMonthlyBudget),
    recommendedDailySpend: roundCurrency(recommendedDailySpend),
    status,
    daysInMonth,
    daysRemaining,
    daysElapsed,
    spendableBudget: roundCurrency(spendableBudget),
    idealDailySpend: roundCurrency(idealDailySpend),
    idealSpentToDate: roundCurrency(idealSpentToDate),
    varianceToDate: roundCurrency(varianceToDate)
  };
}
