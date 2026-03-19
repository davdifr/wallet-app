import { useState } from "react";
import { CalendarClock, Flag, PiggyBank, Trash2 } from "lucide-react";

import { GoalContributionForm } from "@/components/saving-goals/goal-contribution-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Progress } from "@/components/ui/progress";
import { calculateSavingGoalMetrics } from "@/lib/saving-goals/calculations";
import { cn } from "@/lib/utils";
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
  low: "Bassa",
  medium: "Media",
  high: "Alta"
} as const;

const healthStyle = {
  in_linea: "bg-[#7DF4C2]/12 text-[#D7FFF0]",
  lento: "bg-[#FFD166]/12 text-[#FFE7A3]",
  bloccato: "bg-[#FF92B1]/12 text-[#FFD6E2]",
  completato: "bg-[#55C7FF]/12 text-[#B7EAFF]"
} as const;

const priorityStyle = {
  low: "bg-white/[0.05] text-slate-300",
  medium: "bg-[#FFD166]/12 text-[#FFE7A3]",
  high: "bg-[#FF92B1]/12 text-[#FFD6E2]"
} as const;

export function SavingGoalCard({
  goal,
  isSubmittingContribution = false,
  isDeleting = false,
  onAddContribution,
  onDelete
}: SavingGoalCardProps) {
  const metrics = calculateSavingGoalMetrics(goal);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const latestContribution = goal.contributions[0] ?? null;
  const timelineLabel =
    metrics.estimatedMonthsToReach === null ? "Da stimare" : `${metrics.estimatedMonthsToReach} mesi`;
  const timelineSubLabel = metrics.estimatedReachDate
    ? `Stima ${metrics.estimatedReachDate}`
    : "Servono nuovi contributi per consolidare la stima";
  const monthlyNeedLabel =
    metrics.healthStatus === "completato"
      ? "Obiettivo raggiunto"
      : `${formatCurrency(metrics.monthlyContributionNeeded)}/mese`;

  return (
    <>
      <article className="rounded-[1.5rem] bg-card p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium",
                  priorityStyle[goal.priority]
                )}
              >
                Priorita {priorityLabel[goal.priority]}
              </span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium",
                  healthStyle[metrics.healthStatus]
                )}
              >
                {metrics.healthStatus === "in_linea"
                  ? "In linea"
                  : metrics.healthStatus === "lento"
                    ? "In ritardo"
                    : metrics.healthStatus === "bloccato"
                      ? "Bloccato"
                      : "Completato"}
              </span>
            </div>

            <div>
              <h3 className="truncate font-display text-[1.6rem] font-semibold tracking-tight text-foreground">
                {goal.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatCurrency(goal.savedSoFar)} di {formatCurrency(goal.targetAmount)}
                {goal.targetDate ? ` · desiderata ${goal.targetDate}` : ""}
              </p>
              {goal.description ? (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {goal.description}
                </p>
              ) : null}
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="font-display text-[2rem] font-semibold tracking-tight text-[#55C7FF]">
              {metrics.progressPercentage}%
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{metrics.reachabilityLabel}</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>{formatCurrency(goal.savedSoFar)} raccolti</span>
            <span>{formatCurrency(metrics.remainingAmount)} mancanti</span>
          </div>
          <Progress value={metrics.progressPercentage} className="h-3 bg-white/8 [&>div]:bg-[#55C7FF]" />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.1rem] bg-secondary p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <PiggyBank className="h-4 w-4" />
              <span className="text-[10px] uppercase tracking-[0.14em]">Accantonato</span>
            </div>
            <p className="mt-3 text-lg font-semibold text-foreground">
              {formatCurrency(goal.savedSoFar)}
            </p>
          </div>

          <div className="rounded-[1.1rem] bg-secondary p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Flag className="h-4 w-4" />
              <span className="text-[10px] uppercase tracking-[0.14em]">Manca</span>
            </div>
            <p className="mt-3 text-lg font-semibold text-[#FF92B1]">
              {formatCurrency(metrics.remainingAmount)}
            </p>
          </div>

          <div className="rounded-[1.1rem] bg-secondary p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarClock className="h-4 w-4" />
              <span className="text-[10px] uppercase tracking-[0.14em]">Serve</span>
            </div>
            <p className="mt-3 text-lg font-semibold text-[#7DF4C2]">{monthlyNeedLabel}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Ritmo sostenibile {formatCurrency(metrics.averageMonthlySaved)}/mese
            </p>
          </div>

          <div className="rounded-[1.1rem] bg-secondary p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarClock className="h-4 w-4" />
              <span className="text-[10px] uppercase tracking-[0.14em]">Tempo</span>
            </div>
            <p className="mt-3 text-lg font-semibold text-foreground">{timelineLabel}</p>
            <p className="mt-1 text-xs text-muted-foreground">{timelineSubLabel}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-secondary px-3 py-2">
              Protetti oggi {formatCurrency(metrics.monthlyAllocableAmount)}
            </span>
            <span className="rounded-full bg-secondary px-3 py-2">
              Storico {formatCurrency(metrics.totalManualContributionAmount)}
            </span>
            {latestContribution ? (
              <span className="rounded-full bg-secondary px-3 py-2">
                Ultimo {formatCurrency(latestContribution.amount)} · {latestContribution.contributionDate}
              </span>
            ) : null}
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button type="button" className="w-full sm:w-auto" onClick={() => setIsContributionModalOpen(true)}>
              Aggiungi fondi
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              disabled={isDeleting}
              onClick={() => onDelete(goal)}
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Elimino..." : "Elimina"}
            </Button>
          </div>
        </div>
      </article>

      <Modal
        open={isContributionModalOpen}
        onOpenChange={setIsContributionModalOpen}
        title={`Aggiungi fondi a ${goal.title}`}
        description="Un contributo manuale aggiorna subito progresso e stima."
      >
        <GoalContributionForm
          goalId={goal.id}
          isSubmitting={isSubmittingContribution}
          onSubmit={async (values) => {
            const result = await onAddContribution(goal.id, {
              amount: values.amount,
              note: values.note
            });

            if (result.success) {
              setIsContributionModalOpen(false);
            }

            return result;
          }}
        />
        {latestContribution ? (
          <div className="mt-4 rounded-[1rem] bg-secondary px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Ultimo contributo
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {formatCurrency(latestContribution.amount)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {latestContribution.contributionDate}
              {latestContribution.note ? ` · ${latestContribution.note}` : ""}
            </p>
          </div>
        ) : (
          <div className="mt-4 rounded-[1rem] bg-secondary px-4 py-3 text-sm text-muted-foreground">
            Nessun contributo recente per questo goal.
          </div>
        )}
      </Modal>
    </>
  );
}
