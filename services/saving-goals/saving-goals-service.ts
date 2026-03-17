import { createSupabaseServerClient } from "@/lib/supabase/server";
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

function mapContribution(
  row: Database["public"]["Tables"]["goal_contributions"]["Row"]
): GoalContribution {
  return {
    id: row.id,
    amount: row.amount,
    contributionDate: row.contribution_date,
    note: row.note ?? ""
  };
}

function mapGoal(
  row: Database["public"]["Tables"]["saving_goals"]["Row"],
  contributions: GoalContribution[]
): SavingGoal {
  return {
    id: row.id,
    title: row.title,
    targetAmount: row.target_amount,
    targetDate: row.target_date,
    savedSoFar: row.saved_so_far,
    priority: row.priority,
    createdAt: row.created_at,
    contributions
  };
}

async function getSavingGoalById(goalId: string) {
  const supabase = await createSupabaseServerClient();
  const [{ data: goal, error: goalError }, { data: contributions, error: contributionsError }] =
    await Promise.all([
      supabase.from("saving_goals").select("*").eq("id", goalId).single(),
      supabase
        .from("goal_contributions")
        .select("*")
        .eq("goal_id", goalId)
        .order("contribution_date", { ascending: false })
    ]);

  if (goalError) {
    throw new Error(goalError.message);
  }

  if (contributionsError) {
    throw new Error(contributionsError.message);
  }

  return mapGoal(
    goal as SavingGoalRow,
    ((contributions ?? []) as GoalContributionRow[]).map(mapContribution)
  );
}

export async function listSavingGoals() {
  const supabase = await createSupabaseServerClient();

  const [{ data: goals, error: goalsError }, { data: contributions, error: contributionsError }] =
    await Promise.all([
      supabase
        .from("saving_goals")
        .select("*")
        .order("priority", { ascending: false })
        .order("target_date", { ascending: true }),
      supabase
        .from("goal_contributions")
        .select("*")
        .order("contribution_date", { ascending: false })
    ]);

  if (goalsError) {
    throw new Error(goalsError.message);
  }

  if (contributionsError) {
    throw new Error(contributionsError.message);
  }

  const goalRows: SavingGoalRow[] = goals ?? [];
  const contributionRows: GoalContributionRow[] = contributions ?? [];

  const contributionsByGoal = contributionRows.reduce<Record<string, GoalContribution[]>>(
    (acc, item) => {
      acc[item.goal_id] ??= [];
      acc[item.goal_id].push(mapContribution(item));
      return acc;
    },
    {}
  );

  return goalRows.map((goal) => mapGoal(goal, contributionsByGoal[goal.id] ?? []));
}

export async function createSavingGoal(
  userId: string,
  values: SavingGoalFormValues
) {
  const supabase = await createSupabaseServerClient();

  const payload: SavingGoalInsert = {
    user_id: userId,
    title: values.title,
    target_amount: Number(values.targetAmount),
    target_date: values.targetDate,
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

  return mapGoal(data as SavingGoalRow, []);
}

export async function addGoalContribution(
  userId: string,
  values: GoalContributionFormValues
) {
  const supabase = await createSupabaseServerClient();
  const amount = Number(values.amount);

  const { data: goal, error: goalError } = await supabase
    .from("saving_goals")
    .select("*")
    .eq("id", values.goalId)
    .single();

  if (goalError) {
    throw new Error(goalError.message);
  }

  const goalRow = goal as SavingGoalRow;

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

  return getSavingGoalById(values.goalId);
}
