import { estimateGoalReachFromHistory } from "@/lib/saving-goals/forecast";
import type {
  SavingGoal,
  SavingGoalHealthStatus,
  SavingGoalMetrics
} from "@/types/saving-goals";

function roundCurrency(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value * 100) / 100;
}

function sumManualContributions(goal: Pick<SavingGoal, "contributions">) {
  return goal.contributions.reduce((sum, contribution) => sum + contribution.amount, 0);
}

function getHealthStatus(input: {
  averageMonthlySaved: number;
  monthlyContributionNeeded: number;
  remainingAmount: number;
}): SavingGoalHealthStatus {
  if (input.remainingAmount <= 0) {
    return "completato";
  }

  if (input.averageMonthlySaved <= 0) {
    return "bloccato";
  }

  if (input.monthlyContributionNeeded > 0 && input.averageMonthlySaved >= input.monthlyContributionNeeded) {
    return "in_linea";
  }

  return "lento";
}

function getHealthLabel(status: SavingGoalHealthStatus, estimatedMonthsToReach: number | null) {
  switch (status) {
    case "completato":
      return "Obiettivo completato";
    case "in_linea":
      return estimatedMonthsToReach === null
        ? "In linea al ritmo attuale"
        : `In linea · circa ${estimatedMonthsToReach} mesi`;
    case "lento":
      return "Ritmo lento rispetto al necessario";
    case "bloccato":
    default:
      return "Bloccato: servono nuovi contributi";
  }
}

export function calculateSavingGoalMetrics(
  goal: Pick<
    SavingGoal,
    | "contributions"
    | "monthlyAllocableAmount"
    | "savedSoFar"
    | "targetAmount"
    | "targetDate"
  >,
  currentDate = new Date()
): SavingGoalMetrics {
  const savedSoFar = Math.max(goal.savedSoFar, 0);
  const targetAmount = Math.max(goal.targetAmount, 0);
  const totalManualContributionAmount = roundCurrency(
    Math.max(sumManualContributions(goal), savedSoFar)
  );
  const remainingAmount = Math.max(targetAmount - savedSoFar, 0);
  const progressPercentage =
    targetAmount === 0 ? 0 : Math.min((savedSoFar / targetAmount) * 100, 100);
  const forecast = estimateGoalReachFromHistory(
    remainingAmount,
    goal.contributions,
    currentDate
  );
  const monthlyAllocableAmount = roundCurrency(Math.max(goal.monthlyAllocableAmount, 0));
  const monthlyContributionNeeded =
    remainingAmount === 0
      ? 0
      : forecast.estimatedMonthsToReach && forecast.estimatedMonthsToReach > 0
        ? remainingAmount / forecast.estimatedMonthsToReach
        : remainingAmount;
  const healthStatus = getHealthStatus({
    averageMonthlySaved: forecast.averageMonthlySaved,
    monthlyContributionNeeded,
    remainingAmount
  });

  return {
    progressPercentage: roundCurrency(progressPercentage),
    remainingAmount: roundCurrency(remainingAmount),
    totalManualContributionAmount,
    monthlyAllocableAmount,
    monthlyContributionNeeded: roundCurrency(monthlyContributionNeeded),
    averageMonthlySaved: roundCurrency(forecast.averageMonthlySaved),
    estimatedMonthsToReach: forecast.estimatedMonthsToReach,
    estimatedReachDate: forecast.estimatedReachDate,
    reachabilityLabel: getHealthLabel(healthStatus, forecast.estimatedMonthsToReach),
    healthStatus
  };
}
