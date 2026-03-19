import type { GoalPriority, SavingGoalHealthStatus } from "@/types/saving-goals";
import type { ExpenseCategorySlug } from "@/lib/categories/catalog";
import type { DailyBudgetResult } from "@/lib/budget/daily-budget";
import type { PiggyBankSummary } from "@/types/piggy-bank";

export type DashboardTopCategory = {
  name: string;
  amount: string;
  value: number;
  categorySlug: ExpenseCategorySlug;
  isLegacyFallback?: boolean;
  colorClassName: string;
};

export type DashboardGoal = {
  id: string;
  title: string;
  priority: GoalPriority;
  progressPercentage: number;
  savedAmount: string;
  targetAmount: string;
  remainingAmount: string;
  protectedAmount: string;
  contributionNeeded: string;
  timelineLabel: string;
  targetDateLabel?: string | null;
  status: SavingGoalHealthStatus;
  healthLabel: string;
};

export type DashboardActivity = {
  label: string;
  time: string;
  amount: string;
  type: "income" | "expense";
};

export type DashboardData = {
  totalWealthLabel: string;
  balanceLabel: string;
  spendableTodayLabel: string;
  incomeLabel: string;
  expensesLabel: string;
  savingsRateLabel: string;
  monthlyReserveLabel: string;
  protectedGoalsLabel: string;
  trend: number[];
  dailyBudget: DailyBudgetResult;
  piggyBankSummary: PiggyBankSummary;
  topCategories: DashboardTopCategory[];
  goals: DashboardGoal[];
  recentActivity: DashboardActivity[];
};

export type DashboardApiData = DashboardData;
