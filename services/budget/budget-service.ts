import { calculateDailyBudget } from "@/lib/budget/daily-budget";
import { calculateAverageMonthlyExpensesLastThreeMonths } from "@/lib/budget/spending-pace";
import { calculateSavingGoalMetrics } from "@/lib/saving-goals/calculations";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { materializeRecurringIncomes } from "@/services/recurring-incomes/recurring-income-service";
import { getPiggyBankSummary } from "@/services/piggy-bank/piggy-bank-service";
import type { Database } from "@/types/database";
import type { PiggyBankSummary } from "@/types/piggy-bank";

type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];
type RecurringIncomeRow = Database["public"]["Tables"]["recurring_incomes"]["Row"];
type SavingGoalRow = Database["public"]["Tables"]["saving_goals"]["Row"];
type GoalContributionRow = Database["public"]["Tables"]["goal_contributions"]["Row"];

export type BudgetSnapshot = {
  dailyBudget: ReturnType<typeof calculateDailyBudget>;
  totalWealth: number;
  registeredMonthlyIncome: number;
  spentThisMonth: number;
  projectedRecurringIncome: number;
  averageMonthlyExpenses: number;
  piggyBankBalance: number;
  piggyBankSummary: PiggyBankSummary;
  goalProtectionById: Record<string, number>;
};

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

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

function addMonths(date: Date, months: number) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const lastDayOfTargetMonth = new Date(Date.UTC(year, month + months + 1, 0)).getUTCDate();

  return new Date(Date.UTC(year, month + months, Math.min(day, lastDayOfTargetMonth)));
}

function parseDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
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

function getProjectedRecurringIncomeAfterToday(
  recurringIncomes: RecurringIncomeRow[],
  monthEnd: string,
  today: string
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

      if (occurrenceDate >= today) {
        total += recurringIncome.amount;
      }

      occurrenceDate = getNextOccurrenceDate(occurrenceDate, frequency);
    }
  }

  return roundCurrency(total);
}

function getPriorityWeight(priority: SavingGoalRow["priority"]) {
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

export async function getBudgetSnapshot(currentDate = new Date()): Promise<BudgetSnapshot> {
  await materializeRecurringIncomes(currentDate);

  const supabase = await createSupabaseServerClient();
  const { start, end, today } = getMonthBounds(currentDate);
  const monthStart = toIsoDate(start);
  const monthEnd = toIsoDate(end);
  const todayIso = toIsoDate(today);

  const [
    { data: transactionRows, error: transactionsError },
    { data: recurringRows, error: recurringError },
    { data: goalRows, error: goalsError },
    { data: contributionRows, error: contributionsError },
    piggyBankSummary
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("*")
      .in("transaction_type", ["expense", "income"])
      .order("transaction_date", { ascending: false }),
    supabase
      .from("recurring_incomes")
      .select("*")
      .eq("is_active", true)
      .in("frequency", ["weekly", "monthly", "yearly"])
      .lte("next_occurrence_on", monthEnd),
    supabase
      .from("saving_goals")
      .select("*")
      .eq("status", "active"),
    supabase.from("goal_contributions").select("*").order("contribution_date", { ascending: false }),
    getPiggyBankSummary(currentDate)
  ]);

  if (transactionsError) {
    throw new Error(transactionsError.message);
  }

  if (recurringError) {
    throw new Error(recurringError.message);
  }

  if (goalsError) {
    throw new Error(goalsError.message);
  }

  if (contributionsError) {
    throw new Error(contributionsError.message);
  }

  const transactions = (transactionRows ?? []) as TransactionRow[];
  const recurringIncomes = (recurringRows ?? []) as RecurringIncomeRow[];
  const savingGoals = (goalRows ?? []) as SavingGoalRow[];
  const contributions = (contributionRows ?? []) as GoalContributionRow[];
  const contributionsByGoal = contributions.reduce<
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

  const totalWealth = roundCurrency(
    transactions.reduce((sum, transaction) => {
      if (transaction.transaction_type === "income") {
        return sum + transaction.amount;
      }

      if (transaction.transaction_type === "expense") {
        return sum - transaction.amount;
      }

      return sum;
    }, 0)
  );

  const spentThisMonth = roundCurrency(
    transactions
      .filter(
        (transaction) =>
          transaction.transaction_type === "expense" &&
          transaction.transaction_date >= monthStart &&
          transaction.transaction_date <= monthEnd
      )
      .reduce((sum, transaction) => sum + transaction.amount, 0)
  );

  const registeredMonthlyIncome = roundCurrency(
    transactions
      .filter(
        (transaction) =>
          transaction.transaction_type === "income" &&
          transaction.transaction_date >= monthStart &&
          transaction.transaction_date <= monthEnd
      )
      .reduce((sum, transaction) => sum + transaction.amount, 0)
  );

  const projectedRecurringIncome = getProjectedRecurringIncomeAfterToday(
    recurringIncomes,
    monthEnd,
    todayIso
  );

  const averageMonthlyExpenses = calculateAverageMonthlyExpensesLastThreeMonths(
    transactions.map((transaction) => ({
      amount: transaction.amount,
      transactionDate: transaction.transaction_date,
      transactionType:
        transaction.transaction_type === "income" ? "income" : "expense"
    })),
    currentDate
  );
  const goalsInput = savingGoals.map((goal) => {
    const metrics = calculateSavingGoalMetrics(
      {
        contributions: contributionsByGoal[goal.id] ?? [],
        monthlyAllocableAmount: 0,
        savedSoFar: goal.saved_so_far,
        targetAmount: goal.target_amount,
        targetDate: goal.target_date
      },
      currentDate
    );
    const reserveTarget = Math.min(metrics.remainingAmount, metrics.monthlyContributionNeeded);

    return {
      goalId: goal.id,
      reserveTarget: roundCurrency(reserveTarget),
      weight: getPriorityWeight(goal.priority)
    };
  });

  const dailyBudget = calculateDailyBudget({
    registeredMonthlyIncome,
    projectedRecurringIncome,
    registeredMonthlyExpenses: spentThisMonth,
    piggyBankBalance: piggyBankSummary.balance,
    averageMonthlyExpenses,
    goals: goalsInput,
    currentDate
  });

  return {
    dailyBudget,
    totalWealth,
    registeredMonthlyIncome,
    spentThisMonth,
    projectedRecurringIncome,
    averageMonthlyExpenses,
    piggyBankBalance: piggyBankSummary.balance,
    piggyBankSummary,
    goalProtectionById: Object.fromEntries(
      dailyBudget.goalAllocations.map((item) => [item.goalId, item.protectedAmount])
    ),
  };
}
