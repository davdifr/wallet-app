import type { DailyBudgetResult } from "@/lib/budget/daily-budget";
import type { PiggyBankSummary } from "@/types/piggy-bank";

export type DashboardTopCategory = {
  name: string;
  amount: string;
  value: number;
  colorClassName: string;
};

export type DashboardGoal = {
  title: string;
  progress: number;
  helper: string;
  protectedAmount: string;
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
