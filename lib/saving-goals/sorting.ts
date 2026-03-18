import { calculateSavingGoalMetrics } from "@/lib/saving-goals/calculations";
import type { SavingGoal } from "@/types/saving-goals";

function priorityRank(priority: SavingGoal["priority"]) {
  switch (priority) {
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
    default:
      return 1;
  }
}

export function sortSavingGoals(goals: SavingGoal[], currentDate = new Date()) {
  return [...goals].sort((left, right) => {
    const priorityDiff = priorityRank(right.priority) - priorityRank(left.priority);

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    const leftMetrics = calculateSavingGoalMetrics(left, currentDate);
    const rightMetrics = calculateSavingGoalMetrics(right, currentDate);

    const leftEta = leftMetrics.estimatedMonthsToReach ?? Number.POSITIVE_INFINITY;
    const rightEta = rightMetrics.estimatedMonthsToReach ?? Number.POSITIVE_INFINITY;

    if (leftEta !== rightEta) {
      return leftEta - rightEta;
    }

    if (right.monthlyAllocableAmount !== left.monthlyAllocableAmount) {
      return right.monthlyAllocableAmount - left.monthlyAllocableAmount;
    }

    return right.createdAt.localeCompare(left.createdAt);
  });
}
