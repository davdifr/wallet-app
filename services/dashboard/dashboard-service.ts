import { calculateSavingGoalMetrics } from "@/lib/saving-goals/calculations";
import { sortSavingGoals } from "@/lib/saving-goals/sorting";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBudgetSnapshot } from "@/services/budget/budget-service";
import type { DashboardApiData, DashboardData } from "@/types/dashboard";
import type { Database } from "@/types/database";
import type { SavingGoal } from "@/types/saving-goals";

type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];
type SavingGoalRow = Database["public"]["Tables"]["saving_goals"]["Row"];
type GoalContributionRow = Database["public"]["Tables"]["goal_contributions"]["Row"];

const topCategoryColors = [
  "bg-slate-950",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500"
] as const;

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getMonthBounds(currentDate: Date) {
  const year = currentDate.getUTCFullYear();
  const month = currentDate.getUTCMonth();

  return {
    start: new Date(Date.UTC(year, month, 1)),
    end: new Date(Date.UTC(year, month + 1, 0)),
    today: new Date(Date.UTC(year, month, currentDate.getUTCDate()))
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}

function formatSignedCurrency(value: number, type: "income" | "expense") {
  const formatted = formatCurrency(Math.abs(value));
  return type === "income" ? `+ ${formatted}` : `- ${formatted}`;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function getSavingsRate(totalWealth: number, piggyBankBalance: number) {
  if (totalWealth <= 0) {
    return piggyBankBalance > 0 ? 100 : 0;
  }

  return roundCurrency((piggyBankBalance / totalWealth) * 100);
}

function parseDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function buildTrend(transactions: TransactionRow[], currentDate: Date) {
  const valuesByDay = new Map<string, number>();

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(
      Date.UTC(
        currentDate.getUTCFullYear(),
        currentDate.getUTCMonth(),
        currentDate.getUTCDate() - offset
      )
    );

    valuesByDay.set(toIsoDate(date), 0);
  }

  for (const transaction of transactions) {
    if (transaction.transaction_type !== "expense") {
      continue;
    }

    if (!valuesByDay.has(transaction.transaction_date)) {
      continue;
    }

    valuesByDay.set(
      transaction.transaction_date,
      (valuesByDay.get(transaction.transaction_date) ?? 0) + transaction.amount
    );
  }

  return Array.from(valuesByDay.values()).map((value) => Math.max(roundCurrency(value), 0));
}

function formatActivityTime(value: string, now: Date) {
  const date = parseDate(value);
  const today = toIsoDate(now);
  const yesterday = toIsoDate(
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1))
  );
  const isoDate = toIsoDate(date);

  if (isoDate === today) {
    return "Oggi";
  }

  if (isoDate === yesterday) {
    return "Ieri";
  }

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short"
  }).format(date);
}

export async function getDashboardData(currentDate = new Date()): Promise<DashboardData> {
  const supabase = await createSupabaseServerClient();
  const { start, end, today } = getMonthBounds(currentDate);
  const monthStart = toIsoDate(start);
  const monthEnd = toIsoDate(end);

  const [
    budgetSnapshot,
    { data: transactions, error: transactionsError },
    { data: savingGoals, error: goalsError },
    { data: contributions, error: contributionsError }
  ] = await Promise.all([
    getBudgetSnapshot(currentDate),
    supabase
      .from("transactions")
      .select("*")
      .in("transaction_type", ["expense", "income"])
      .gte("transaction_date", monthStart)
      .lte("transaction_date", monthEnd)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("saving_goals")
      .select("*")
      .in("status", ["active", "completed"])
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("goal_contributions")
      .select("*")
      .order("contribution_date", { ascending: false })
  ]);

  if (transactionsError) {
    throw new Error(transactionsError.message);
  }

  if (goalsError) {
    throw new Error(goalsError.message);
  }

  if (contributionsError) {
    throw new Error(contributionsError.message);
  }

  const transactionRows = (transactions ?? []) as TransactionRow[];
  const savingGoalRows = (savingGoals ?? []) as SavingGoalRow[];
  const contributionRows = (contributions ?? []) as GoalContributionRow[];

  const contributionsByGoal = contributionRows.reduce<
    Record<string, Array<{ id: string; amount: number; contributionDate: string; note: string }>>
  >((acc, item) => {
    acc[item.goal_id] ??= [];
    acc[item.goal_id].push({
      id: item.id,
      amount: item.amount,
      contributionDate: item.contribution_date,
      note: item.note ?? ""
    });
    return acc;
  }, {});

  const monthlyIncome = roundCurrency(
    transactionRows
      .filter((transaction) => transaction.transaction_type === "income")
      .reduce((sum, transaction) => sum + transaction.amount, 0)
  );
  const monthlyExpenses = roundCurrency(
    transactionRows
      .filter((transaction) => transaction.transaction_type === "expense")
      .reduce((sum, transaction) => sum + transaction.amount, 0)
  );

  const topCategories = Array.from(
    transactionRows
      .filter((transaction) => transaction.transaction_type === "expense")
      .reduce<Map<string, number>>((accumulator, transaction) => {
        const category = transaction.category?.trim() || "Uncategorized";
        accumulator.set(category, (accumulator.get(category) ?? 0) + transaction.amount);
        return accumulator;
      }, new Map())
      .entries()
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([name, value], index) => ({
      name,
      amount: formatCurrency(value),
      value: roundCurrency(value),
      colorClassName: topCategoryColors[index % topCategoryColors.length]
    }));

  const sortedGoals: SavingGoal[] = sortSavingGoals(
    savingGoalRows.map((goal) => ({
      id: goal.id,
      title: goal.title,
      description: goal.description ?? "",
      targetAmount: goal.target_amount,
      targetDate: goal.target_date,
      savedSoFar: goal.saved_so_far,
      priority: goal.priority,
      createdAt: goal.created_at,
      contributions: contributionsByGoal[goal.id] ?? [],
      protectionPreviewAmount: budgetSnapshot.goalProtectionById[goal.id] ?? 0,
      monthlyAllocableAmount: budgetSnapshot.goalProtectionById[goal.id] ?? 0
    })),
    currentDate
  );

  const goals = sortedGoals.slice(0, 3).map((goal) => {
    const protectedAmount = budgetSnapshot.goalProtectionById[goal.id] ?? 0;
    const metrics = calculateSavingGoalMetrics(
      {
        contributions: goal.contributions,
        monthlyAllocableAmount: protectedAmount,
        savedSoFar: goal.savedSoFar,
        targetAmount: goal.targetAmount,
        targetDate: goal.targetDate
      },
      currentDate
    );
    const helper =
      metrics.remainingAmount <= 0
        ? "Goal completato"
        : `${formatCurrency(metrics.remainingAmount)} mancanti · ${
            metrics.estimatedReachDate
              ? `stima ${metrics.estimatedReachDate}`
              : metrics.reachabilityLabel.toLowerCase()
          }`;

    return {
      title: goal.title,
      progress: Math.round(metrics.progressPercentage),
      helper,
      protectedAmount: formatCurrency(protectedAmount),
      healthLabel: metrics.reachabilityLabel
    };
  });

  const recentActivity = transactionRows.slice(0, 6).map((transaction) => ({
    label: transaction.merchant ?? transaction.category ?? "Transazione",
    time: formatActivityTime(transaction.transaction_date, today),
    amount: formatSignedCurrency(
      transaction.amount,
      transaction.transaction_type === "income" ? "income" : "expense"
    ),
    type: (transaction.transaction_type === "income" ? "income" : "expense") as
      | "income"
      | "expense"
  }));

  return {
    totalWealthLabel: formatCurrency(budgetSnapshot.totalWealth),
    balanceLabel: formatCurrency(budgetSnapshot.dailyBudget.monthlyAvailableLiquidity),
    spendableTodayLabel: formatCurrency(budgetSnapshot.dailyBudget.dailyBudget),
    incomeLabel: formatCurrency(
      budgetSnapshot.registeredMonthlyIncome + budgetSnapshot.projectedRecurringIncome
    ),
    expensesLabel: formatCurrency(monthlyExpenses),
    savingsRateLabel: `${Math.round(
      getSavingsRate(budgetSnapshot.totalWealth, budgetSnapshot.piggyBankBalance)
    )}%`,
    monthlyReserveLabel: formatCurrency(budgetSnapshot.dailyBudget.remainingMonthReserve),
    protectedGoalsLabel: formatCurrency(budgetSnapshot.dailyBudget.protectedForGoals),
    trend: buildTrend(transactionRows, today),
    dailyBudget: budgetSnapshot.dailyBudget,
    piggyBankSummary: budgetSnapshot.piggyBankSummary,
    topCategories,
    goals,
    recentActivity
  };
}

export function serializeDashboardData(data: DashboardData): DashboardApiData {
  return data;
}
