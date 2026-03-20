import { useState } from "react";
import { CalendarClock, Flag, PiggyBank, Trash2 } from "lucide-react";

import { GoalContributionForm } from "@/components/saving-goals/goal-contribution-form";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00.000Z`));
}

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
  const monthlyNeedLabel =
    metrics.healthStatus === "completato"
      ? "Obiettivo raggiunto"
      : `${formatCurrency(metrics.monthlyContributionNeeded)}/mese`;
  const sustainablePaceLabel =
    metrics.monthlyAllocableAmount > 0
      ? `Disponibile ora ${formatCurrency(metrics.monthlyAllocableAmount)}/mese`
      : metrics.averageMonthlySaved > 0
        ? `Storico contributi ${formatCurrency(metrics.averageMonthlySaved)}/mese`
        : "Nessuna quota sostenibile disponibile al momento";

  return (
    <>
      <article className="rounded-[1.5rem] bg-card p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div>
              <h3 className="truncate font-display text-[1.6rem] font-semibold tracking-tight text-foreground">
                {goal.title}
              </h3>
              {goal.description ? (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {goal.description}
                </p>
              ) : null}
              {goal.targetDate ? (
                <p className="mt-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Target entro {formatDate(goal.targetDate)}
                </p>
              ) : null}
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="font-display text-[2rem] font-semibold tracking-tight text-[#55C7FF]">
              {metrics.progressPercentage}%
            </div>
          </div>
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
            <p className="mt-1 text-xs text-muted-foreground">{sustainablePaceLabel}</p>
          </div>

          <div className="rounded-[1.1rem] bg-secondary p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarClock className="h-4 w-4" />
              <span className="text-[10px] uppercase tracking-[0.14em]">Tempo</span>
            </div>
            <p className="mt-3 text-lg font-semibold text-foreground">{timelineLabel}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {metrics.estimatedReachDate
                ? `Stima ${metrics.estimatedReachDate}`
                : "La stima apparira quando il budget del mese o lo storico daranno un ritmo stabile"}
            </p>
          </div>
        </div>

        <div className="mt-5 flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => setIsContributionModalOpen(true)}
          >
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
