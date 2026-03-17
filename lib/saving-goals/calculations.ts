import type { SavingGoal, SavingGoalMetrics } from "@/types/saving-goals";

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function monthDiff(from: Date, to: Date) {
  return (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth());
}

function toUtcDate(value: string | Date) {
  if (value instanceof Date) {
    return new Date(
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())
    );
  }

  return new Date(`${value}T00:00:00.000Z`);
}

export function calculateSavingGoalMetrics(
  goal: Pick<SavingGoal, "createdAt" | "savedSoFar" | "targetAmount" | "targetDate">,
  currentDate = new Date()
): SavingGoalMetrics {
  const savedSoFar = Math.max(goal.savedSoFar, 0);
  const targetAmount = Math.max(goal.targetAmount, 0);
  const remainingAmount = Math.max(targetAmount - savedSoFar, 0);
  const progressPercentage =
    targetAmount === 0 ? 0 : Math.min((savedSoFar / targetAmount) * 100, 100);

  const currentMonthDate = toUtcDate(currentDate);
  const createdAtDate = toUtcDate(goal.createdAt);
  const monthsObserved = Math.max(1, monthDiff(createdAtDate, currentMonthDate) + 1);
  const averageMonthlySaved = savedSoFar / monthsObserved;

  let monthsRemaining = 1;

  if (goal.targetDate) {
    const targetDate = toUtcDate(goal.targetDate);

    if (targetDate < currentMonthDate) {
      monthsRemaining = 0;
    } else {
      monthsRemaining = Math.max(1, monthDiff(currentMonthDate, targetDate) + 1);
    }
  }

  const monthlyContributionNeeded =
    remainingAmount === 0 || monthsRemaining === 0
      ? remainingAmount
      : remainingAmount / monthsRemaining;

  const isReachable =
    remainingAmount === 0
      ? true
      : goal.targetDate
        ? monthsRemaining > 0 && averageMonthlySaved >= monthlyContributionNeeded
        : true;

  const reachabilityLabel =
    remainingAmount === 0
      ? "Obiettivo completato"
      : goal.targetDate
        ? isReachable
          ? "Raggiungibile al ritmo attuale"
          : "Richiede un ritmo di risparmio piu alto"
        : "Senza data limite";

  return {
    progressPercentage: roundCurrency(progressPercentage),
    remainingAmount: roundCurrency(remainingAmount),
    monthsRemaining,
    monthlyContributionNeeded: roundCurrency(monthlyContributionNeeded),
    averageMonthlySaved: roundCurrency(averageMonthlySaved),
    isReachable,
    reachabilityLabel
  };
}
