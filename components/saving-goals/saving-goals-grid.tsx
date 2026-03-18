import { SavingGoalCard } from "@/components/saving-goals/saving-goal-card";
import type { GoalContributionFormState, SavingGoal } from "@/types/saving-goals";

type SavingGoalsGridProps = {
  goals: SavingGoal[];
  submittingGoalId?: string | null;
  deletingGoalId?: string | null;
  onAddContribution: (
    goalId: string,
    values: { amount: string; note: string }
  ) => Promise<GoalContributionFormState>;
  onDelete: (goal: SavingGoal) => void;
};

export function SavingGoalsGrid({
  goals,
  submittingGoalId = null,
  deletingGoalId = null,
  onAddContribution,
  onDelete
}: SavingGoalsGridProps) {
  if (goals.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-12 text-center">
        <h3 className="font-display text-xl font-semibold text-slate-950">
          Nessun saving goal configurato
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          Crea il primo goal per iniziare a misurare progressi e contributi.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {goals.map((goal) => (
        <SavingGoalCard
          key={goal.id}
          goal={goal}
          isSubmittingContribution={submittingGoalId === goal.id}
          isDeleting={deletingGoalId === goal.id}
          onAddContribution={onAddContribution}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
