import Link from "next/link";
import { useMemo, useState } from "react";
import { Target } from "lucide-react";

import { GoalContributionForm } from "@/components/saving-goals/goal-contribution-form";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { DashboardShellCard } from "@/components/dashboard/dashboard-shell-card";
import { Progress } from "@/components/ui/progress";
import type { GoalContributionFormState } from "@/types/saving-goals";
import type { DashboardGoal } from "@/types/dashboard";

type SavingGoalsStatusCardProps = {
  goals: DashboardGoal[];
  submittingGoalId?: string | null;
  onAddContribution: (
    goalId: string,
    values: { amount: string; note: string }
  ) => Promise<GoalContributionFormState>;
};

export function SavingGoalsStatusCard({
  goals,
  submittingGoalId = null,
  onAddContribution
}: SavingGoalsStatusCardProps) {
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const activeGoal = useMemo(
    () => goals.find((goal) => goal.id === activeGoalId) ?? null,
    [activeGoalId, goals]
  );

  return (
    <DashboardShellCard
      title="Goal"
      action={<Target className="mt-1 h-4 w-4 text-slate-500" />}
      contentClassName="space-y-3"
    >
      {goals.length === 0 ? (
        <div className="rounded-[1.2rem] bg-white/[0.03] px-5 py-8 text-center text-sm text-slate-400">
          Nessun obiettivo attivo da mostrare.
        </div>
      ) : (
        goals.map((goal) => (
          <div key={goal.id} className="rounded-[1.2rem] bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-white">{goal.title}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {goal.savedAmount} di {goal.targetAmount}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span className="block font-display text-[1.6rem] font-semibold tracking-tight text-white">
                  {goal.progressPercentage}%
                </span>
              </div>
            </div>
            <Progress
              value={goal.progressPercentage}
              className="mt-4 h-2.5 bg-white/10 [&>div]:bg-[#55C7FF]"
            />
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-[1rem] bg-[#0D1320] px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Manca</p>
                <p className="mt-2 text-sm font-semibold text-white">{goal.remainingAmount}</p>
              </div>
              <div className="rounded-[1rem] bg-[#0D1320] px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Serve</p>
                <p className="mt-2 text-sm font-semibold text-white">{goal.contributionNeeded}</p>
              </div>
              <div className="rounded-[1rem] bg-[#0D1320] px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Tempo</p>
                <p className="mt-2 text-sm font-semibold text-white">{goal.timelineLabel}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                size="sm"
                className="flex-1"
                onClick={() => setActiveGoalId(goal.id)}
              >
                Aggiungi fondi
              </Button>
              <Button asChild type="button" variant="outline" size="sm" className="flex-1">
                <Link href="/saving-goals">Apri</Link>
              </Button>
            </div>
          </div>
        ))
      )}

      <Modal
        open={activeGoal !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActiveGoalId(null);
          }
        }}
        title={activeGoal ? `Aggiungi fondi a ${activeGoal.title}` : "Aggiungi fondi"}
        description="Un contributo manuale aggiorna subito progresso e stima."
      >
        {activeGoal ? (
          <GoalContributionForm
            goalId={activeGoal.id}
            isSubmitting={submittingGoalId === activeGoal.id}
            onSubmit={(values) =>
              onAddContribution(activeGoal.id, { amount: values.amount, note: values.note })
            }
          />
        ) : null}
      </Modal>
    </DashboardShellCard>
  );
}
