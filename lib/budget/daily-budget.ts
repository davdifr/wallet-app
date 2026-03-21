import {
  distributeGoalProtection,
  type GoalProtectionAllocation,
  type GoalProtectionInput
} from "@/lib/budget/goal-protection";

export type DailyBudgetStatus = "in_linea" | "attenzione" | "fuori_budget";

export type DailyBudgetInput = {
  registeredMonthlyIncome: number;
  projectedRecurringIncome: number;
  projectedRecurringExpenses?: number;
  registeredMonthlyExpenses: number;
  piggyBankBalance: number;
  averageMonthlyExpenses: number;
  goals: GoalProtectionInput[];
  currentDate: Date;
};

export type DailyBudgetWarnings = {
  negativeBudget: boolean;
  underfundedGoals: boolean;
  insufficientLiquidity: boolean;
};

export type DailyBudgetResult = {
  dailyBudget: number;
  recommendedDailySpend: number;
  remainingMonthlyBudget: number;
  spendableBalance: number;
  monthlyAvailableLiquidity: number;
  projectedRecurringIncome: number;
  projectedRecurringExpenses: number;
  blockedInPiggyBank: number;
  prudentialReserve: number;
  remainingMonthReserve: number;
  goalCapacity: number;
  protectedForGoals: number;
  goalAllocations: GoalProtectionAllocation[];
  daysInMonth: number;
  daysRemaining: number;
  daysElapsed: number;
  explanation: string;
  warnings: DailyBudgetWarnings;
  status: DailyBudgetStatus;
};

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function getMonthMeta(currentDate: Date) {
  const year = currentDate.getUTCFullYear();
  const month = currentDate.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const currentDay = currentDate.getUTCDate();
  const normalizedDay = Math.min(Math.max(currentDay, 1), daysInMonth);
  const daysElapsed = normalizedDay;
  const daysRemaining = Math.max(daysInMonth - normalizedDay + 1, 1);

  return {
    daysElapsed,
    daysInMonth,
    daysRemaining
  };
}

function buildExplanation(input: {
  spendableBalance: number;
  blockedInPiggyBank: number;
  prudentialReserve: number;
  protectedForGoals: number;
  daysRemaining: number;
  warnings: DailyBudgetWarnings;
}) {
  const parts = [
    `Spendibile mese ${input.spendableBalance.toFixed(2)} EUR`,
    `salvadanaio ${input.blockedInPiggyBank.toFixed(2)} EUR`,
    `riserva ${input.prudentialReserve.toFixed(2)} EUR`,
    `goal ${input.protectedForGoals.toFixed(2)} EUR`,
    `${input.daysRemaining} giorni residui`
  ];

  if (input.warnings.negativeBudget) {
    parts.push("budget negativo");
  } else if (input.warnings.underfundedGoals) {
    parts.push("goal sottofinanziati");
  } else if (input.warnings.insufficientLiquidity) {
    parts.push("liquidita insufficiente");
  }

  return parts.join(" · ");
}

export function calculateDailyBudget(input: DailyBudgetInput): DailyBudgetResult {
  const registeredMonthlyIncome = Math.max(input.registeredMonthlyIncome, 0);
  const projectedRecurringIncome = Math.max(input.projectedRecurringIncome, 0);
  const projectedRecurringExpenses = Math.max(input.projectedRecurringExpenses ?? 0, 0);
  const registeredMonthlyExpenses = Math.max(input.registeredMonthlyExpenses, 0);
  const blockedInPiggyBank = Math.max(input.piggyBankBalance, 0);
  const averageMonthlyExpenses = Math.max(input.averageMonthlyExpenses, 0);

  const { daysElapsed, daysInMonth, daysRemaining } = getMonthMeta(input.currentDate);

  const monthlyAvailableLiquidity =
    registeredMonthlyIncome +
    projectedRecurringIncome -
    registeredMonthlyExpenses -
    projectedRecurringExpenses -
    blockedInPiggyBank;
  const prudentialReserve = averageMonthlyExpenses;
  const remainingMonthReserve = Math.max(prudentialReserve - registeredMonthlyExpenses, 0);
  const goalCapacity = Math.max(monthlyAvailableLiquidity - remainingMonthReserve, 0);
  const goalAllocations = distributeGoalProtection(goalCapacity, input.goals);
  const protectedForGoals = goalAllocations.reduce(
    (sum, allocation) => sum + allocation.protectedAmount,
    0
  );
  const rawSpendableBalance =
    monthlyAvailableLiquidity - remainingMonthReserve - protectedForGoals;
  const spendableBalance = Math.max(rawSpendableBalance, 0);
  const dailyBudget = spendableBalance <= 0 ? 0 : spendableBalance / daysRemaining;

  const warnings: DailyBudgetWarnings = {
    negativeBudget: rawSpendableBalance < 0 || monthlyAvailableLiquidity < 0,
    underfundedGoals: goalAllocations.some((allocation) => allocation.unmetAmount > 0.009),
    insufficientLiquidity: spendableBalance <= 0
  };

  let status: DailyBudgetStatus = "in_linea";

  if (warnings.negativeBudget) {
    status = "fuori_budget";
  } else if (warnings.underfundedGoals || warnings.insufficientLiquidity) {
    status = "attenzione";
  }

  return {
    dailyBudget: roundCurrency(dailyBudget),
    recommendedDailySpend: roundCurrency(dailyBudget),
    remainingMonthlyBudget: roundCurrency(spendableBalance),
    spendableBalance: roundCurrency(spendableBalance),
    monthlyAvailableLiquidity: roundCurrency(monthlyAvailableLiquidity),
    projectedRecurringIncome: roundCurrency(projectedRecurringIncome),
    projectedRecurringExpenses: roundCurrency(projectedRecurringExpenses),
    blockedInPiggyBank: roundCurrency(blockedInPiggyBank),
    prudentialReserve: roundCurrency(prudentialReserve),
    remainingMonthReserve: roundCurrency(remainingMonthReserve),
    goalCapacity: roundCurrency(goalCapacity),
    protectedForGoals: roundCurrency(protectedForGoals),
    goalAllocations,
    daysInMonth,
    daysRemaining,
    daysElapsed,
    explanation: buildExplanation({
      spendableBalance: roundCurrency(spendableBalance),
      blockedInPiggyBank: roundCurrency(blockedInPiggyBank),
      prudentialReserve: roundCurrency(remainingMonthReserve),
      protectedForGoals: roundCurrency(protectedForGoals),
      daysRemaining,
      warnings
    }),
    warnings,
    status
  };
}
