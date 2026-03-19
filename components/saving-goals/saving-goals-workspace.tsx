"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Plus, Target } from "lucide-react";

import { useSyncSourceId } from "@/components/providers/dashboard-query-provider";
import { SavingGoalsGrid } from "@/components/saving-goals/saving-goals-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { NoticeCard } from "@/components/ui/notice-card";
import { fetchJson } from "@/lib/query/fetch-json";
import { invalidateDomainQueries } from "@/lib/query/invalidate-domain-cache";
import { queryKeys } from "@/lib/query/query-keys";
import { publishSyncEvent } from "@/lib/query/sync-events";
import { calculateSavingGoalMetrics } from "@/lib/saving-goals/calculations";
import { sortSavingGoals } from "@/lib/saving-goals/sorting";
import { cn } from "@/lib/utils";
import type {
  GoalContributionFormState,
  SavingGoal,
  SavingGoalFormState,
  SavingGoalFormValues
} from "@/types/saving-goals";

const SavingGoalForm = dynamic(
  () => import("@/components/saving-goals/saving-goal-form").then((mod) => mod.SavingGoalForm)
);

type SavingGoalsWorkspaceProps = {
  initialGoals: SavingGoal[];
};

type GoalViewFilter = "all" | "active" | "attention" | "completed";

function sortGoals(items: SavingGoal[]) {
  return sortSavingGoals(items);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}

export function SavingGoalsWorkspace({ initialGoals }: SavingGoalsWorkspaceProps) {
  const [submittingContributionGoalId, setSubmittingContributionGoalId] = useState<string | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageMessage, setPageMessage] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<SavingGoal | null>(null);
  const [activeFilter, setActiveFilter] = useState<GoalViewFilter>("active");
  const queryClient = useQueryClient();
  const syncSourceId = useSyncSourceId();
  const initialData = useMemo(() => ({ goals: sortGoals(initialGoals) }), [initialGoals]);

  const savingGoalsQuery = useQuery({
    queryKey: queryKeys.savingGoals.all,
    queryFn: () =>
      fetchJson<{ goals: SavingGoal[] }>("/api/saving-goals", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store"
      }),
    initialData
  });

  const createGoalMutation = useMutation({
    mutationFn: async (values: SavingGoalFormValues) =>
      fetchJson<{ goal: SavingGoal }>("/api/saving-goals", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      })
  });

  const addContributionMutation = useMutation({
    mutationFn: async ({ goalId, values }: { goalId: string; values: { amount: string; note: string } }) =>
      fetchJson<{ goal: SavingGoal }>(`/api/saving-goals/${goalId}/contributions`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      })
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) =>
      fetchJson<{ goal: SavingGoal }>(`/api/saving-goals/${goalId}`, {
        method: "DELETE",
        credentials: "same-origin"
      })
  });

  const goals = sortGoals(savingGoalsQuery.data?.goals ?? initialData.goals);
  const goalSnapshots = useMemo(
    () =>
      goals.map((goal) => ({
        goal,
        metrics: calculateSavingGoalMetrics(goal)
      })),
    [goals]
  );
  const focusGoal =
    goalSnapshots.find(({ metrics }) => metrics.healthStatus !== "completato")?.goal ??
    goalSnapshots[0]?.goal ??
    null;
  const focusMetrics = focusGoal ? calculateSavingGoalMetrics(focusGoal) : null;
  const totalSaved = goalSnapshots.reduce((sum, item) => sum + item.goal.savedSoFar, 0);
  const totalRemaining = goalSnapshots.reduce((sum, item) => sum + item.metrics.remainingAmount, 0);
  const attentionCount = goalSnapshots.filter(
    ({ metrics }) => metrics.healthStatus === "lento" || metrics.healthStatus === "bloccato"
  ).length;
  const onTrackCount = goalSnapshots.filter(
    ({ metrics }) => metrics.healthStatus === "in_linea" || metrics.healthStatus === "completato"
  ).length;
  const visibleGoals = goalSnapshots
    .filter(({ metrics }) => {
      if (activeFilter === "all") {
        return true;
      }
      if (activeFilter === "completed") {
        return metrics.healthStatus === "completato";
      }
      if (activeFilter === "attention") {
        return metrics.healthStatus === "lento" || metrics.healthStatus === "bloccato";
      }

      return metrics.healthStatus !== "completato";
    })
    .map(({ goal }) => goal);

  async function syncSavingGoalsDomain() {
    await invalidateDomainQueries(queryClient, "saving-goals");

    publishSyncEvent({
      id: crypto.randomUUID(),
      domain: "saving-goals",
      sourceId: syncSourceId,
      timestamp: Date.now()
    });
  }

  async function handleCreateGoal(
    values: SavingGoalFormValues
  ): Promise<SavingGoalFormState> {
    setPageError(null);
    setPageMessage(null);

    try {
      const data = await createGoalMutation.mutateAsync(values);

      queryClient.setQueryData<{ goals: SavingGoal[] }>(queryKeys.savingGoals.all, (current) => ({
        goals: sortGoals([data.goal, ...(current?.goals ?? [])])
      }));

      setIsCreateModalOpen(false);
      await syncSavingGoalsDomain();

      return {
        success: true,
        message: "Obiettivo creato con successo."
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Impossibile creare il goal."
      };
    }
  }

  async function handleAddContribution(
    goalId: string,
    values: { amount: string; note: string }
  ): Promise<GoalContributionFormState> {
    setSubmittingContributionGoalId(goalId);
    setPageError(null);
    setPageMessage(null);

    try {
      const data = await addContributionMutation.mutateAsync({ goalId, values });

      queryClient.setQueryData<{ goals: SavingGoal[] }>(queryKeys.savingGoals.all, (current) => ({
        goals: sortGoals(
          (current?.goals ?? []).map((goal) => (goal.id === goalId ? data.goal : goal))
        )
      }));

      await syncSavingGoalsDomain();

      return {
        success: true,
        message: "Contributo aggiunto."
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Impossibile aggiungere il contributo."
      };
    } finally {
      setSubmittingContributionGoalId(null);
    }
  }

  async function handleDeleteGoal() {
    if (!goalToDelete) {
      return;
    }

    const target = goalToDelete;
    setDeletingGoalId(target.id);
    setPageError(null);
    setPageMessage(null);

    try {
      await deleteGoalMutation.mutateAsync(target.id);

      queryClient.setQueryData<{ goals: SavingGoal[] }>(queryKeys.savingGoals.all, (current) => ({
        goals: sortGoals((current?.goals ?? []).filter((goal) => goal.id !== target.id))
      }));

      setGoalToDelete(null);
      setPageMessage("Goal eliminato correttamente.");
      await syncSavingGoalsDomain();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Impossibile eliminare il goal.");
    } finally {
      setDeletingGoalId(null);
    }
  }

  return (
    <div className="space-y-7">
      <section className="space-y-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-[2.3rem] font-semibold tracking-tight text-foreground">
              Goals
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Vedi subito dove sei in linea, cosa sta rallentando e dove conviene mettere il prossimo contributo.
            </p>
          </div>

          <Button type="button" className="w-full sm:w-auto" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Nuovo goal
          </Button>
        </div>
      </section>

      {pageError ? <NoticeCard title="Operazione non completata" message={pageError} /> : null}

      {savingGoalsQuery.error instanceof Error ? (
        <NoticeCard title="Goals non disponibili" message={savingGoalsQuery.error.message} />
      ) : null}

      {pageMessage ? <NoticeCard title="Aggiornamento eseguito" message={pageMessage} /> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.35rem] bg-card p-4 shadow-card">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Accantonato</p>
          <p className="mt-3 font-display text-[1.9rem] font-semibold tracking-tight text-foreground">
            {formatCurrency(totalSaved)}
          </p>
        </div>
        <div className="rounded-[1.35rem] bg-card p-4 shadow-card">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Da raggiungere</p>
          <p className="mt-3 font-display text-[1.9rem] font-semibold tracking-tight text-[#FF92B1]">
            {formatCurrency(totalRemaining)}
          </p>
        </div>
        <div className="rounded-[1.35rem] bg-card p-4 shadow-card">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">In linea</p>
          <p className="mt-3 font-display text-[1.9rem] font-semibold tracking-tight text-[#7DF4C2]">
            {onTrackCount}
          </p>
        </div>
        <div className="rounded-[1.35rem] bg-card p-4 shadow-card">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Da spingere</p>
          <p className="mt-3 font-display text-[1.9rem] font-semibold tracking-tight text-[#FFD166]">
            {attentionCount}
          </p>
        </div>
      </section>

      {focusGoal ? (
        <section className="rounded-[1.5rem] bg-card p-5 shadow-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Badge variant="secondary" className="w-fit">
                Focus del mese
              </Badge>
              <div>
                <h2 className="font-display text-[1.9rem] font-semibold tracking-tight text-foreground">
                  {focusGoal.title}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Il goal più rilevante da monitorare adesso, in base a priorità e distanza dal traguardo.
                </p>
              </div>
            </div>

            <Button type="button" className="w-full sm:w-auto" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Nuovo goal
            </Button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.2rem] bg-secondary p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="h-4 w-4" />
                <span className="text-[10px] uppercase tracking-[0.14em]">Progresso</span>
              </div>
              <p className="mt-3 text-xl font-semibold text-foreground">
                {Math.round(focusMetrics?.progressPercentage ?? 0)}%
              </p>
            </div>
            <div className="rounded-[1.2rem] bg-secondary p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-[10px] uppercase tracking-[0.14em]">Manca</span>
              </div>
              <p className="mt-3 text-xl font-semibold text-[#FF92B1]">
                {formatCurrency(focusMetrics?.remainingAmount ?? 0)}
              </p>
            </div>
            <div className="rounded-[1.2rem] bg-secondary p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-[10px] uppercase tracking-[0.14em]">Serve al mese</span>
              </div>
              <p className="mt-3 text-xl font-semibold text-[#7DF4C2]">
                {formatCurrency(focusMetrics?.monthlyContributionNeeded ?? 0)}
              </p>
            </div>
            <div className="rounded-[1.2rem] bg-secondary p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="h-4 w-4" />
                <span className="text-[10px] uppercase tracking-[0.14em]">Tempo stimato</span>
              </div>
              <p className="mt-3 text-xl font-semibold text-foreground">
                {focusMetrics?.estimatedMonthsToReach === null
                  ? "Da stimare"
                  : `${focusMetrics?.estimatedMonthsToReach} mesi`}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {([
            ["active", "Da finanziare"],
            ["attention", "Da spingere"],
            ["completed", "Completati"],
            ["all", "Tutti"]
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={cn(
                "min-h-11 rounded-full px-4 text-sm font-medium transition",
                activeFilter === value
                  ? "bg-primary text-primary-foreground shadow-card"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <SavingGoalsGrid
          goals={visibleGoals}
          submittingGoalId={submittingContributionGoalId}
          deletingGoalId={deletingGoalId}
          onAddContribution={handleAddContribution}
          onDelete={(goal) => {
            setPageError(null);
            setPageMessage(null);
            setGoalToDelete(goal);
          }}
        />
      </section>

      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Nuovo goal"
        description="Imposta target e priorità. La data desiderata resta opzionale."
      >
        <SavingGoalForm isSubmitting={createGoalMutation.isPending} onSubmit={handleCreateGoal} />
      </Modal>

      <Modal
        open={goalToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setGoalToDelete(null);
          }
        }}
        title="Conferma eliminazione"
        description="Il goal verra eliminato insieme allo storico dei contributi collegati."
      >
        {goalToDelete ? (
          <div className="space-y-5">
            <div className="rounded-3xl border border-input bg-card px-5 py-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{goalToDelete.title}</p>
              <p className="mt-1">
                Target {goalToDelete.targetAmount.toLocaleString("it-IT", {
                  style: "currency",
                  currency: "EUR"
                })}{" "}
                · contributi registrati {goalToDelete.contributions.length}
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setGoalToDelete(null)}
                disabled={deletingGoalId === goalToDelete.id}
              >
                Annulla
              </Button>
              <Button
                type="button"
                onClick={() => void handleDeleteGoal()}
                disabled={deletingGoalId === goalToDelete.id}
              >
                {deletingGoalId === goalToDelete.id ? "Elimino..." : "Elimina"}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
