import type { GoalContribution } from "@/types/saving-goals";

export type SavingGoalForecast = {
  averageMonthlySaved: number;
  estimatedMonthsToReach: number | null;
  estimatedReachDate: string | null;
};

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addMonths(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

export function calculateAverageMonthlyGoalContribution(
  contributions: GoalContribution[],
  currentDate = new Date()
) {
  const monthStarts = [2, 1, 0].map((offset) =>
    new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() - offset, 1))
  );
  const totals = new Map<string, number>(monthStarts.map((month) => [toIsoDate(month), 0]));

  for (const contribution of contributions) {
    const monthKey = `${contribution.contributionDate.slice(0, 7)}-01`;

    if (!totals.has(monthKey)) {
      continue;
    }

    totals.set(monthKey, (totals.get(monthKey) ?? 0) + contribution.amount);
  }

  const average = Array.from(totals.values()).reduce((sum, value) => sum + value, 0) / 3;
  return roundCurrency(average);
}

export function estimateGoalReachFromHistory(
  remainingAmount: number,
  contributions: GoalContribution[],
  currentDate = new Date()
): SavingGoalForecast {
  const averageMonthlySaved = calculateAverageMonthlyGoalContribution(
    contributions,
    currentDate
  );

  if (remainingAmount <= 0) {
    return {
      averageMonthlySaved,
      estimatedMonthsToReach: 0,
      estimatedReachDate: toIsoDate(currentDate)
    };
  }

  if (averageMonthlySaved <= 0) {
    return {
      averageMonthlySaved,
      estimatedMonthsToReach: null,
      estimatedReachDate: null
    };
  }

  const estimatedMonthsToReach = Math.ceil(remainingAmount / averageMonthlySaved);
  const estimatedReachDate = toIsoDate(addMonths(currentDate, estimatedMonthsToReach - 1));

  return {
    averageMonthlySaved,
    estimatedMonthsToReach,
    estimatedReachDate
  };
}
