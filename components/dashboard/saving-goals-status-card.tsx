import { Target } from "lucide-react";

import { DashboardShellCard } from "@/components/dashboard/dashboard-shell-card";
import { Progress } from "@/components/ui/progress";

type GoalItem = {
  title: string;
  progress: number;
  helper: string;
};

type SavingGoalsStatusCardProps = {
  goals: GoalItem[];
};

export function SavingGoalsStatusCard({ goals }: SavingGoalsStatusCardProps) {
  return (
    <DashboardShellCard
      title="Stato Saving Goals"
      subtitle="Focus sugli obiettivi piu vicini"
      action={
        <div className="rounded-2xl bg-slate-100 p-2 text-slate-700">
          <Target className="h-4 w-4" />
        </div>
      }
      contentClassName="space-y-4"
    >
      {goals.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-10 text-center text-sm text-slate-500">
          Nessun saving goal attivo da mostrare.
        </div>
      ) : (
        goals.map((goal) => (
          <div key={goal.title} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">{goal.title}</p>
                <p className="mt-1 text-sm text-slate-500">{goal.helper}</p>
              </div>
              <span className="font-display text-2xl font-semibold text-slate-950">
                {goal.progress}%
              </span>
            </div>
            <Progress value={goal.progress} className="mt-4 h-2.5" />
          </div>
        ))
      )}
    </DashboardShellCard>
  );
}
