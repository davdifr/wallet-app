"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Sparkles } from "lucide-react";

import { useSyncSourceId } from "@/components/providers/dashboard-query-provider";
import { SavingGoalsGrid } from "@/components/saving-goals/saving-goals-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { fetchJson } from "@/lib/query/fetch-json";
import { invalidateDomainQueries } from "@/lib/query/invalidate-domain-cache";
import { queryKeys } from "@/lib/query/query-keys";
import { publishSyncEvent } from "@/lib/query/sync-events";
import { sortSavingGoals } from "@/lib/saving-goals/sorting";
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

function sortGoals(items: SavingGoal[]) {
  return sortSavingGoals(items);
}

export function SavingGoalsWorkspace({ initialGoals }: SavingGoalsWorkspaceProps) {
  const [submittingContributionGoalId, setSubmittingContributionGoalId] = useState<string | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageMessage, setPageMessage] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<SavingGoal | null>(null);
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="secondary" className="w-fit">
              Obiettivi attivi
            </Badge>
            <div className="mt-3">
              <h1 className="font-display text-[2.2rem] font-semibold tracking-tight text-foreground">
                Obiettivi di risparmio
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                Crea obiettivi con target e priorita, monitora il progresso e registra
                contributi manuali. La previsione usa la media degli ultimi 3 mesi.
              </p>
            </div>
          </div>

          <Button type="button" className="w-full sm:w-auto" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Nuovo goal
          </Button>
        </div>
      </section>

      {pageError ? (
        <div className="rounded-[1.5rem] bg-secondary px-5 py-4 text-sm text-foreground">
          {pageError}
        </div>
      ) : null}

      {savingGoalsQuery.error instanceof Error ? (
        <div className="rounded-[1.5rem] bg-secondary px-5 py-4 text-sm text-foreground">
          {savingGoalsQuery.error.message}
        </div>
      ) : null}

      {pageMessage ? (
        <div className="rounded-[1.5rem] bg-secondary px-5 py-4 text-sm text-foreground">
          {pageMessage}
        </div>
      ) : null}

      <section>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-foreground">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="font-display text-[1.75rem] tracking-tight text-foreground">
                  Goal dettagliati
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Ogni card mostra progresso, ritmo storico, protezione teorica e stima.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <SavingGoalsGrid
              goals={goals}
              submittingGoalId={submittingContributionGoalId}
              deletingGoalId={deletingGoalId}
              onAddContribution={handleAddContribution}
              onDelete={(goal) => {
                setPageError(null);
                setPageMessage(null);
                setGoalToDelete(goal);
              }}
            />
          </CardContent>
        </Card>
      </section>

      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Nuovo saving goal"
        description="Definisci target, priorita e una nota facoltativa. La data desiderata resta opzionale."
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
