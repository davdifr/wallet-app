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
  in_linea: "border border-[#7DF4C2]/20 bg-[#7DF4C2]/10 text-[#D7FFF0]",
  lento: "border border-[#FFD166]/20 bg-[#FFD166]/10 text-[#FFE7A3]",
  bloccato: "border border-[#FF92B1]/20 bg-[#FF92B1]/10 text-[#FFD6E2]",
  completato: "border border-[#55C7FF]/20 bg-[#55C7FF]/10 text-[#B7EAFF]"
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
    <article className="rounded-[1.85rem] bg-card p-5 shadow-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 pr-14">
            <Badge variant="secondary">
              {priorityLabel[goal.priority]}
            </Badge>
            <Badge className={healthStyle[metrics.healthStatus]}>
              {metrics.reachabilityLabel}
            </Badge>
          </div>
          <div>
            <h3 className="font-display text-[1.75rem] font-semibold tracking-tight text-foreground">
              {goal.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Target {formatCurrency(goal.targetAmount)}
              {goal.targetDate ? ` · data desiderata ${goal.targetDate}` : ""}
            </p>
            {goal.description ? (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{goal.description}</p>
            ) : null}
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start sm:shrink-0"
          disabled={isDeleting}
          onClick={() => onDelete(goal)}
        >
          <Trash2 className="h-4 w-4" />
          {isDeleting ? "Elimino..." : "Elimina"}
        </Button>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {formatCurrency(goal.savedSoFar)} di {formatCurrency(goal.targetAmount)}
          </div>
          <div className="font-display text-2xl font-semibold tracking-tight text-[#55C7FF]">
            {metrics.progressPercentage}%
          </div>
        </div>
        <Progress value={metrics.progressPercentage} className="h-2.5" />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.35rem] bg-secondary p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <PiggyBank className="h-4 w-4" />
            <span className="text-xs uppercase tracking-[0.18em]">Accantonato</span>
          </div>
          <p className="mt-3 text-xl font-semibold text-foreground">
            {formatCurrency(goal.savedSoFar)}
          </p>
        </div>

        <div className="rounded-[1.35rem] bg-secondary p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Flag className="h-4 w-4" />
            <span className="text-xs uppercase tracking-[0.18em]">Manca</span>
          </div>
          <p className="mt-3 text-xl font-semibold text-[#FF92B1]">
            {formatCurrency(metrics.remainingAmount)}
          </p>
        </div>

        <div className="rounded-[1.35rem] bg-secondary p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarClock className="h-4 w-4" />
            <span className="text-xs uppercase tracking-[0.18em]">Al Mese</span>
          </div>
          <p className="mt-3 text-xl font-semibold text-[#7DF4C2]">
            {formatCurrency(metrics.monthlyAllocableAmount)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Quota teorica allocabile in base alla priorita
          </p>
        </div>

        <div className="rounded-[1.35rem] bg-secondary p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <PiggyBank className="h-4 w-4" />
            <span className="text-xs uppercase tracking-[0.18em]">Ritmo Medio</span>
          </div>
          <p className="mt-3 text-xl font-semibold text-foreground">
            {formatCurrency(metrics.averageMonthlySaved)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Media degli ultimi 3 mesi</p>
        </div>

        <div className="rounded-[1.35rem] bg-secondary p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Flag className="h-4 w-4" />
            <span className="text-xs uppercase tracking-[0.18em]">Stima Target</span>
          </div>
          <p className="mt-3 text-xl font-semibold text-foreground">
            {metrics.estimatedMonthsToReach === null
              ? "Da stimare"
              : `${metrics.estimatedMonthsToReach} mesi`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {metrics.estimatedReachDate
              ? `Possibile da ${metrics.estimatedReachDate}`
              : "Servono piu contributi per stimare"}
          </p>
        </div>

        <div className="rounded-[1.35rem] bg-secondary p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <PiggyBank className="h-4 w-4" />
            <span className="text-xs uppercase tracking-[0.18em]">Protezione</span>
          </div>
          <p className="mt-3 text-xl font-semibold text-foreground">
            {formatCurrency(metrics.totalManualContributionAmount)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Totale contributi manuali storici</p>
        </div>

        <div className="rounded-[1.35rem] bg-secondary p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarClock className="h-4 w-4" />
            <span className="text-xs uppercase tracking-[0.18em]">Stato Goal</span>
          </div>
          <p className="mt-3 text-xl font-semibold capitalize text-foreground">
            {metrics.healthStatus.replace("_", " ")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
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
          <p className="text-sm font-medium text-foreground">Ultimi contributi</p>
          {goal.contributions.slice(0, 3).map((contribution) => (
            <div
              key={contribution.id}
              className="flex items-center justify-between rounded-[1.2rem] bg-secondary px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {formatCurrency(contribution.amount)}
                </p>
                <p className="text-xs text-muted-foreground">
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
