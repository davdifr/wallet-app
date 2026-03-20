import { calculateAverageMonthlyGoalContribution } from "@/lib/saving-goals/forecast";
import type {
  SavingGoal,
  SavingGoalHealthStatus,
  SavingGoalMetrics
} from "@/types/saving-goals";

const DEFAULT_GOAL_TIMELINE_MONTHS = 12;

function roundCurrency(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value * 100) / 100;
}

function sumManualContributions(goal: Pick<SavingGoal, "contributions">) {
  return goal.contributions.reduce((sum, contribution) => sum + contribution.amount, 0);
}

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addMonths(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function getPlanningHorizonMonths(targetDate: string | null, currentDate: Date) {
  if (!targetDate) {
    return DEFAULT_GOAL_TIMELINE_MONTHS;
  }

  const parsedTargetDate = new Date(`${targetDate}T00:00:00.000Z`);

  if (Number.isNaN(parsedTargetDate.getTime())) {
    return DEFAULT_GOAL_TIMELINE_MONTHS;
  }

  if (parsedTargetDate < currentDate) {
    return 1;
  }

  const monthDiff =
    (parsedTargetDate.getUTCFullYear() - currentDate.getUTCFullYear()) * 12 +
    (parsedTargetDate.getUTCMonth() - currentDate.getUTCMonth());

  return Math.max(monthDiff + 1, 1);
}

function estimateGoalReachFromMonthlyContribution(
  remainingAmount: number,
  monthlyContribution: number,
  currentDate: Date
) {
  if (remainingAmount <= 0) {
    return {
      estimatedMonthsToReach: 0,
      estimatedReachDate: toIsoDate(currentDate)
    };
  }

  if (monthlyContribution <= 0) {
    return {
      estimatedMonthsToReach: null,
      estimatedReachDate: null
    };
  }

  const estimatedMonthsToReach = Math.ceil(remainingAmount / monthlyContribution);

  return {
    estimatedMonthsToReach,
    estimatedReachDate: toIsoDate(addMonths(currentDate, estimatedMonthsToReach - 1))
  };
}

function getHealthStatus(input: {
  effectiveMonthlyContribution: number;
  monthlyContributionNeeded: number;
  remainingAmount: number;
}): SavingGoalHealthStatus {
  if (input.remainingAmount <= 0) {
    return "completato";
  }

  if (input.effectiveMonthlyContribution <= 0) {
    return "bloccato";
  }

  if (
    input.monthlyContributionNeeded > 0 &&
    input.effectiveMonthlyContribution >= input.monthlyContributionNeeded
  ) {
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
      return estimatedMonthsToReach === null
        ? "Ritmo lento rispetto al necessario"
        : `Ritmo lento · circa ${estimatedMonthsToReach} mesi`;
    case "bloccato":
    default:
      return "Bloccato: nessuna quota mensile disponibile";
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
  const averageMonthlySaved = calculateAverageMonthlyGoalContribution(
    goal.contributions,
    currentDate
  );
  const monthlyAllocableAmount = roundCurrency(Math.max(goal.monthlyAllocableAmount, 0));
  const planningHorizonMonths = getPlanningHorizonMonths(goal.targetDate, currentDate);
  const monthlyContributionNeeded =
    remainingAmount === 0
      ? 0
      : remainingAmount / planningHorizonMonths;
  const effectiveMonthlyContribution = roundCurrency(
    monthlyAllocableAmount > 0 ? monthlyAllocableAmount : averageMonthlySaved
  );
  const forecast = estimateGoalReachFromMonthlyContribution(
    remainingAmount,
    effectiveMonthlyContribution,
    currentDate
  );
  const healthStatus = getHealthStatus({
    effectiveMonthlyContribution,
    monthlyContributionNeeded,
    remainingAmount
  });

  return {
    progressPercentage: roundCurrency(progressPercentage),
    remainingAmount: roundCurrency(remainingAmount),
    totalManualContributionAmount,
    monthlyAllocableAmount,
    monthlyContributionNeeded: roundCurrency(monthlyContributionNeeded),
    averageMonthlySaved: roundCurrency(averageMonthlySaved),
    estimatedMonthsToReach: forecast.estimatedMonthsToReach,
    estimatedReachDate: forecast.estimatedReachDate,
    reachabilityLabel: getHealthLabel(healthStatus, forecast.estimatedMonthsToReach),
    healthStatus
  };
}
