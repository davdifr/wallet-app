import { calculateSavingGoalMetrics } from "@/lib/saving-goals/calculations";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { materializeRecurringIncomes } from "@/services/recurring-incomes/recurring-income-service";
import type { Database } from "@/types/database";

type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];
type RecurringIncomeRow = Database["public"]["Tables"]["recurring_incomes"]["Row"];
type MonthlyBudgetSettingsRow =
  Database["public"]["Tables"]["monthly_budget_settings"]["Row"];
type SavingGoalRow = Database["public"]["Tables"]["saving_goals"]["Row"];

type DashboardTopCategory = {
  name: string;
  amount: string;
  value: number;
  colorClassName: string;
};

type DashboardGoal = {
  title: string;
  progress: number;
  helper: string;
};

type DashboardActivity = {
  label: string;
  time: string;
  amount: string;
  type: "income" | "expense";
};

export type DashboardData = {
  balanceLabel: string;
  incomeLabel: string;
  expensesLabel: string;
  savingsRateLabel: string;
  savingsTargetLabel: string;
  trend: number[];
  dailyBudgetInput: {
    expectedMonthlyIncome: number;
    registeredMonthlyExpenses: number;
    monthlySavingsTarget: number;
    currentDate: Date;
  };
  topCategories: DashboardTopCategory[];
  goals: DashboardGoal[];
  recentActivity: DashboardActivity[];
};

export type DashboardApiData = Omit<DashboardData, "dailyBudgetInput"> & {
  dailyBudgetInput: Omit<DashboardData["dailyBudgetInput"], "currentDate"> & {
    currentDate: string;
  };
};

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

function getSavingsRate(monthlyIncome: number, monthlyExpenses: number) {
  if (monthlyIncome <= 0) {
    return monthlyExpenses > 0 ? -100 : 0;
  }

  return roundCurrency(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100);
}

function parseDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function addMonths(date: Date, months: number) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const lastDayOfTargetMonth = new Date(Date.UTC(year, month + months + 1, 0)).getUTCDate();

  return new Date(Date.UTC(year, month + months, Math.min(day, lastDayOfTargetMonth)));
}

function getNextOccurrenceDate(
  currentDate: string,
  frequency: "weekly" | "monthly" | "yearly"
) {
  const base = parseDate(currentDate);

  switch (frequency) {
    case "weekly":
      return toIsoDate(new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000));
    case "monthly":
      return toIsoDate(addMonths(base, 1));
    case "yearly":
      return toIsoDate(addMonths(base, 12));
  }
}

function getProjectedRecurringIncomeForMonth(
  recurringIncomes: RecurringIncomeRow[],
  monthEnd: string
) {
  let total = 0;

  for (const recurringIncome of recurringIncomes) {
    if (!recurringIncome.is_active) {
      continue;
    }

    const frequency =
      recurringIncome.frequency === "weekly" ||
      recurringIncome.frequency === "monthly" ||
      recurringIncome.frequency === "yearly"
        ? recurringIncome.frequency
        : null;

    if (!frequency) {
      continue;
    }

    let occurrenceDate = recurringIncome.next_occurrence_on;

    while (occurrenceDate <= monthEnd) {
      if (recurringIncome.ends_on && occurrenceDate > recurringIncome.ends_on) {
        break;
      }

      total += recurringIncome.amount;
      occurrenceDate = getNextOccurrenceDate(occurrenceDate, frequency);
    }
  }

  return roundCurrency(total);
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
  await materializeRecurringIncomes(currentDate);

  const supabase = await createSupabaseServerClient();
  const { start, end, today } = getMonthBounds(currentDate);
  const monthStart = toIsoDate(start);
  const monthEnd = toIsoDate(end);

  const [
    { data: transactions, error: transactionsError },
    { data: recurringIncomes, error: recurringError },
    { data: budgetSetting, error: budgetError },
    { data: savingGoals, error: goalsError }
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("*")
      .in("transaction_type", ["expense", "income"])
      .gte("transaction_date", monthStart)
      .lte("transaction_date", monthEnd)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("recurring_incomes")
      .select("*")
      .eq("is_active", true)
      .in("frequency", ["weekly", "monthly", "yearly"])
      .lte("next_occurrence_on", monthEnd),
    supabase
      .from("monthly_budget_settings")
      .select("*")
      .eq("budget_month", monthStart)
      .maybeSingle(),
    supabase
      .from("saving_goals")
      .select("*")
      .in("status", ["active", "completed"])
      .order("target_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
  ]);

  if (transactionsError) {
    throw new Error(transactionsError.message);
  }

  if (recurringError) {
    throw new Error(recurringError.message);
  }

  if (budgetError) {
    throw new Error(budgetError.message);
  }

  if (goalsError) {
    throw new Error(goalsError.message);
  }

  const transactionRows = (transactions ?? []) as TransactionRow[];
  const recurringIncomeRows = (recurringIncomes ?? []) as RecurringIncomeRow[];
  const monthlyBudget = budgetSetting as MonthlyBudgetSettingsRow | null;
  const savingGoalRows = (savingGoals ?? []) as SavingGoalRow[];

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
  const savingsTarget = monthlyBudget?.target_savings ?? 0;
  const projectedRecurringIncome = getProjectedRecurringIncomeForMonth(
    recurringIncomeRows,
    monthEnd
  );
  const expectedMonthlyIncome = roundCurrency(monthlyIncome + projectedRecurringIncome);
  const projectedMonthBalance = roundCurrency(expectedMonthlyIncome - monthlyExpenses);

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

  const goals = savingGoalRows
    .filter((goal) => goal.status !== "cancelled" && goal.status !== "paused")
    .slice(0, 3)
    .map((goal) => {
      const metrics = calculateSavingGoalMetrics(
        {
          createdAt: goal.created_at,
          savedSoFar: goal.saved_so_far,
          targetAmount: goal.target_amount,
          targetDate: goal.target_date
        },
        currentDate
      );

      const helper =
        metrics.remainingAmount <= 0
          ? "Goal completato"
          : `${formatCurrency(metrics.remainingAmount)} mancanti · ${metrics.reachabilityLabel.toLowerCase()}`;

      return {
        title: goal.title,
        progress: Math.round(metrics.progressPercentage),
        helper
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
    balanceLabel: formatCurrency(projectedMonthBalance),
    incomeLabel: formatCurrency(expectedMonthlyIncome),
    expensesLabel: formatCurrency(monthlyExpenses),
    savingsRateLabel: `${Math.round(getSavingsRate(expectedMonthlyIncome, monthlyExpenses))}%`,
    savingsTargetLabel: formatCurrency(savingsTarget),
    trend: buildTrend(transactionRows, today),
    dailyBudgetInput: {
      expectedMonthlyIncome,
      registeredMonthlyExpenses: monthlyExpenses,
      monthlySavingsTarget: savingsTarget,
      currentDate
    },
    topCategories,
    goals,
    recentActivity
  };
}

export function serializeDashboardData(data: DashboardData): DashboardApiData {
  return {
    ...data,
    dailyBudgetInput: {
      ...data.dailyBudgetInput,
      currentDate: data.dailyBudgetInput.currentDate.toISOString()
    }
  };
}
