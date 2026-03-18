import type { Database } from "@/types/database";

export type GoalPriority = Database["public"]["Enums"]["goal_priority"];

export type GoalContribution = {
  id: string;
  amount: number;
  contributionDate: string;
  note: string;
};

export type SavingGoal = {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  targetDate: string | null;
  savedSoFar: number;
  priority: GoalPriority;
  createdAt: string;
  contributions: GoalContribution[];
  protectionPreviewAmount: number;
  monthlyAllocableAmount: number;
};

export type SavingGoalFormValues = {
  title: string;
  description: string;
  targetAmount: string;
  targetDate: string;
  priority: GoalPriority;
};

export type GoalContributionFormValues = {
  goalId: string;
  amount: string;
  note: string;
};

export type SavingGoalFormState = {
  success: boolean;
  message?: string;
  errors?: Partial<Record<keyof SavingGoalFormValues | "general", string[]>>;
};

export type GoalContributionFormState = {
  success: boolean;
  message?: string;
  errors?: Partial<Record<keyof GoalContributionFormValues | "general", string[]>>;
};

export type SavingGoalHealthStatus = "in_linea" | "lento" | "bloccato" | "completato";

export type SavingGoalMetrics = {
  progressPercentage: number;
  remainingAmount: number;
  totalManualContributionAmount: number;
  monthlyAllocableAmount: number;
  monthlyContributionNeeded: number;
  averageMonthlySaved: number;
  estimatedMonthsToReach: number | null;
  estimatedReachDate: string | null;
  reachabilityLabel: string;
  healthStatus: SavingGoalHealthStatus;
};
