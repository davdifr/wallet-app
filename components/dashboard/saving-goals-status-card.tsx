import { Target } from "lucide-react";

import { DashboardShellCard } from "@/components/dashboard/dashboard-shell-card";
import { Progress } from "@/components/ui/progress";

type GoalItem = {
  title: string;
  progress: number;
  helper: string;
  protectedAmount: string;
  healthLabel: string;
};

type SavingGoalsStatusCardProps = {
  goals: GoalItem[];
};

export function SavingGoalsStatusCard({ goals }: SavingGoalsStatusCardProps) {
  return (
    <DashboardShellCard
      title="Goal da tenere in rotta"
      subtitle="Solo quelli che incidono davvero sul margine di oggi"
      action={<Target className="mt-1 h-4 w-4 text-slate-500" />}
      contentClassName="space-y-3"
    >
      {goals.length === 0 ? (
        <div className="rounded-[1.2rem] bg-white/[0.03] px-5 py-8 text-center text-sm text-slate-400">
          Nessun obiettivo attivo da mostrare.
        </div>
      ) : (
        goals.map((goal) => (
          <div key={goal.title} className="rounded-[1.2rem] bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-white">{goal.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">{goal.helper}</p>
              </div>
              <div className="shrink-0 text-right">
                <span className="block font-display text-[1.6rem] font-semibold tracking-tight text-white">
                  {goal.progress}%
                </span>
              </div>
            </div>
            <Progress value={goal.progress} className="mt-4 h-2 bg-white/10 [&>div]:bg-[#55C7FF]" />
            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
              <span>{goal.healthLabel}</span>
              <span>{goal.protectedAmount} protetti</span>
            </div>
          </div>
        ))
      )}
    </DashboardShellCard>
  );
}
