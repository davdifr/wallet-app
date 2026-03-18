import { CalendarClock, Flag, PiggyBank, Trash2 } from "lucide-react";

import { GoalContributionForm } from "@/components/saving-goals/goal-contribution-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { calculateSavingGoalMetrics } from "@/lib/saving-goals/calculations";
import type { GoalContributionFormState, SavingGoal } from "@/types/saving-goals";

type SavingGoalCardProps = {
  goal: SavingGoal;
  isSubmittingContribution?: boolean;
  isDeleting?: boolean;
  onAddContribution: (
    goalId: string,
    values: { amount: string; note: string }
  ) => Promise<GoalContributionFormState>;
  onDelete: (goal: SavingGoal) => void;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}

const priorityLabel = {
  low: "Priorita bassa",
  medium: "Priorita media",
  high: "Priorita alta"
} as const;

const healthStyle = {
  in_linea: "bg-emerald-100 text-emerald-700",
  lento: "bg-amber-100 text-amber-700",
  bloccato: "bg-rose-100 text-rose-700",
  completato: "bg-sky-100 text-sky-700"
} as const;

export function SavingGoalCard({
  goal,
  isSubmittingContribution = false,
  isDeleting = false,
  onAddContribution,
  onDelete
}: SavingGoalCardProps) {
  const metrics = calculateSavingGoalMetrics(goal);

  return (
    <article className="rounded-[2rem] border border-slate-200 bg-slate-50/80 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 pr-14">
            <Badge variant="secondary" className="bg-white text-slate-700">
              {priorityLabel[goal.priority]}
            </Badge>
            <Badge className={healthStyle[metrics.healthStatus]}>
              {metrics.reachabilityLabel}
            </Badge>
          </div>
          <div>
            <h3 className="font-display text-2xl font-semibold text-slate-950">
              {goal.title}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Target {formatCurrency(goal.targetAmount)}
              {goal.targetDate ? ` · data desiderata ${goal.targetDate}` : ""}
            </p>
            {goal.description ? (
              <p className="mt-2 max-w-2xl text-sm text-slate-500">{goal.description}</p>
            ) : null}
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start border-rose-200 px-3 text-rose-600 hover:bg-rose-50 hover:text-rose-700 sm:shrink-0"
          disabled={isDeleting}
          onClick={() => onDelete(goal)}
        >
          <Trash2 className="h-4 w-4" />
          {isDeleting ? "Elimino..." : "Elimina"}
        </Button>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="text-sm text-slate-500">
            {formatCurrency(goal.savedSoFar)} di {formatCurrency(goal.targetAmount)}
          </div>
          <div className="font-display text-2xl font-semibold text-slate-950">
            {metrics.progressPercentage}%
          </div>
        </div>
        <Progress value={metrics.progressPercentage} className="h-3.5 bg-slate-200/90" />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <PiggyBank className="h-4 w-4" />
            <span className="text-xs uppercase tracking-[0.18em]">Accantonato</span>
          </div>
          <p className="mt-3 text-xl font-semibold text-slate-950">
            {formatCurrency(goal.savedSoFar)}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Flag className="h-4 w-4" />
            <span className="text-xs uppercase tracking-[0.18em]">Manca</span>
          </div>
          <p className="mt-3 text-xl font-semibold text-slate-950">
            {formatCurrency(metrics.remainingAmount)}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <CalendarClock className="h-4 w-4" />
            <span className="text-xs uppercase tracking-[0.18em]">Al Mese</span>
          </div>
          <p className="mt-3 text-xl font-semibold text-slate-950">
            {formatCurrency(metrics.monthlyAllocableAmount)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Quota teorica allocabile in base alla priorita
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <PiggyBank className="h-4 w-4" />
            <span className="text-xs uppercase tracking-[0.18em]">Ritmo Medio</span>
          </div>
          <p className="mt-3 text-xl font-semibold text-slate-950">
            {formatCurrency(metrics.averageMonthlySaved)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Media degli ultimi 3 mesi</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Flag className="h-4 w-4" />
            <span className="text-xs uppercase tracking-[0.18em]">Stima Target</span>
          </div>
          <p className="mt-3 text-xl font-semibold text-slate-950">
            {metrics.estimatedMonthsToReach === null
              ? "Da stimare"
              : `${metrics.estimatedMonthsToReach} mesi`}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {metrics.estimatedReachDate
              ? `Possibile da ${metrics.estimatedReachDate}`
              : "Servono piu contributi per stimare"}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <PiggyBank className="h-4 w-4" />
            <span className="text-xs uppercase tracking-[0.18em]">Protezione</span>
          </div>
          <p className="mt-3 text-xl font-semibold text-slate-950">
            {formatCurrency(metrics.totalManualContributionAmount)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Totale contributi manuali storici</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <CalendarClock className="h-4 w-4" />
            <span className="text-xs uppercase tracking-[0.18em]">Stato Goal</span>
          </div>
          <p className="mt-3 text-xl font-semibold capitalize text-slate-950">
            {metrics.healthStatus.replace("_", " ")}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {goal.targetDate
              ? `Ritmo necessario ${formatCurrency(metrics.monthlyContributionNeeded)}/mese`
              : "Basato solo sul ritmo sostenibile"}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <GoalContributionForm
          goalId={goal.id}
          isSubmitting={isSubmittingContribution}
          onSubmit={(values) =>
            onAddContribution(goal.id, { amount: values.amount, note: values.note })
          }
        />
      </div>

      {goal.contributions.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-slate-700">Ultimi contributi</p>
          {goal.contributions.slice(0, 3).map((contribution) => (
            <div
              key={contribution.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {formatCurrency(contribution.amount)}
                </p>
                <p className="text-xs text-slate-500">
                  {contribution.contributionDate}
                  {contribution.note ? ` · ${contribution.note}` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}
