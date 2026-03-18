import { calculateSavingGoalMetrics } from "@/lib/saving-goals/calculations";
import { sortSavingGoals } from "@/lib/saving-goals/sorting";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBudgetSnapshot } from "@/services/budget/budget-service";
import type { Database } from "@/types/database";
import type {
  GoalContribution,
  GoalContributionFormValues,
  SavingGoal,
  SavingGoalFormValues
} from "@/types/saving-goals";

type SavingGoalInsert = Database["public"]["Tables"]["saving_goals"]["Insert"];
type SavingGoalRow = Database["public"]["Tables"]["saving_goals"]["Row"];
type SavingGoalUpdate = Database["public"]["Tables"]["saving_goals"]["Update"];
type GoalContributionInsert =
  Database["public"]["Tables"]["goal_contributions"]["Insert"];
type GoalContributionRow = Database["public"]["Tables"]["goal_contributions"]["Row"];

class SavingGoalsServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "SavingGoalsServiceError";
    this.statusCode = statusCode;
  }
}

function mapContribution(row: GoalContributionRow): GoalContribution {
  return {
    id: row.id,
    amount: row.amount,
    contributionDate: row.contribution_date,
    note: row.note ?? ""
  };
}

function mapGoal(
  row: SavingGoalRow,
  contributions: GoalContribution[],
  monthlyAllocableAmount: number
): SavingGoal {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    targetAmount: row.target_amount,
    targetDate: row.target_date,
    savedSoFar: row.saved_so_far,
    priority: row.priority,
    createdAt: row.created_at,
    contributions,
    protectionPreviewAmount: monthlyAllocableAmount,
    monthlyAllocableAmount
  };
}

function buildGoalsWithAllocations(
  goalRows: SavingGoalRow[],
  contributionRows: GoalContributionRow[],
  goalProtectionById: Record<string, number>,
  currentDate: Date
) {
  const contributionsByGoal = contributionRows.reduce<Record<string, GoalContribution[]>>(
    (acc, item) => {
      acc[item.goal_id] ??= [];
      acc[item.goal_id].push(mapContribution(item));
      return acc;
    },
    {}
  );

  const goals = goalRows.map((goal) =>
    mapGoal(
      goal,
      contributionsByGoal[goal.id] ?? [],
      goalProtectionById[goal.id] ?? 0
    )
  );

  return sortSavingGoals(goals, currentDate);
}

async function getSavingGoalById(goalId: string, currentDate = new Date()) {
  const supabase = await createSupabaseServerClient();
  const [
    { data: goal, error: goalError },
    { data: contributions, error: contributionsError },
    budgetSnapshot
  ] = await Promise.all([
    supabase.from("saving_goals").select("*").eq("id", goalId).single(),
    supabase
      .from("goal_contributions")
      .select("*")
      .eq("goal_id", goalId)
      .order("contribution_date", { ascending: false }),
    getBudgetSnapshot(currentDate)
  ]);

  if (goalError) {
    throw new Error(goalError.message);
  }

  if (contributionsError) {
    throw new Error(contributionsError.message);
  }

  return mapGoal(
    goal as SavingGoalRow,
    ((contributions ?? []) as GoalContributionRow[]).map(mapContribution),
    budgetSnapshot.goalProtectionById[goalId] ?? 0
  );
}

async function getOwnedSavingGoal(userId: string, goalId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("saving_goals")
    .select("*")
    .eq("id", goalId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new SavingGoalsServiceError("Goal non trovato.", 404);
    }

    throw new Error(error.message);
  }

  return data as SavingGoalRow;
}

export async function listSavingGoals(currentDate = new Date()) {
  const supabase = await createSupabaseServerClient();

  const [
    { data: goals, error: goalsError },
    { data: contributions, error: contributionsError },
    budgetSnapshot
  ] = await Promise.all([
    supabase.from("saving_goals").select("*").order("priority", { ascending: false }),
    supabase
      .from("goal_contributions")
      .select("*")
      .order("contribution_date", { ascending: false }),
    getBudgetSnapshot(currentDate)
  ]);

  if (goalsError) {
    throw new Error(goalsError.message);
  }

  if (contributionsError) {
    throw new Error(contributionsError.message);
  }

  const goalRows: SavingGoalRow[] = goals ?? [];
  const contributionRows: GoalContributionRow[] = contributions ?? [];

  return buildGoalsWithAllocations(
    goalRows,
    contributionRows,
    budgetSnapshot.goalProtectionById,
    currentDate
  );
}

export async function createSavingGoal(userId: string, values: SavingGoalFormValues) {
  const supabase = await createSupabaseServerClient();

  const payload: SavingGoalInsert = {
    user_id: userId,
    title: values.title,
    description: values.description || null,
    target_amount: Number(values.targetAmount),
    target_date: values.targetDate || null,
    saved_so_far: 0,
    priority: values.priority,
    currency: "EUR",
    status: "active"
  };

  const { data, error } = await supabase
    .from("saving_goals")
    .insert(payload as never)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapGoal(data as SavingGoalRow, [], 0);
}

export async function addGoalContribution(
  userId: string,
  values: GoalContributionFormValues
) {
  const supabase = await createSupabaseServerClient();
  const amount = Number(values.amount);
  const goalRow = await getOwnedSavingGoal(userId, values.goalId);

  const contributionPayload: GoalContributionInsert = {
    goal_id: values.goalId,
    user_id: userId,
    amount,
    contribution_date: new Date().toISOString().slice(0, 10),
    note: values.note || null
  };

  const { error: contributionError } = await supabase
    .from("goal_contributions")
    .insert(contributionPayload as never);

  if (contributionError) {
    throw new Error(contributionError.message);
  }

  const nextSavedAmount = goalRow.saved_so_far + amount;
  const nextStatus =
    nextSavedAmount >= goalRow.target_amount ? "completed" : goalRow.status;

  const { error: updateError } = await supabase
    .from("saving_goals")
    .update({
      saved_so_far: nextSavedAmount,
      status: nextStatus
    } as SavingGoalUpdate as never)
    .eq("id", values.goalId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const result = await getSavingGoalById(values.goalId);
  return result;
}

export async function deleteSavingGoal(userId: string, goalId: string) {
  const goal = await getOwnedSavingGoal(userId, goalId);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("saving_goals")
    .delete()
    .eq("id", goalId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return mapGoal(goal, [], 0);
}
