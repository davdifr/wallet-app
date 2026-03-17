"use client";

import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";

import { SavingGoalForm } from "@/components/saving-goals/saving-goal-form";
import { SavingGoalsGrid } from "@/components/saving-goals/saving-goals-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import type {
  GoalContributionFormState,
  SavingGoal,
  SavingGoalFormState,
  SavingGoalFormValues
} from "@/types/saving-goals";

type SavingGoalsWorkspaceProps = {
  initialGoals: SavingGoal[];
};

async function readResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { message?: string };

  if (!response.ok) {
    throw new Error(data.message ?? "Richiesta non riuscita.");
  }

  return data;
}

export function SavingGoalsWorkspace({ initialGoals }: SavingGoalsWorkspaceProps) {
  const [goals, setGoals] = useState(initialGoals);
  const [isSubmittingGoal, setIsSubmittingGoal] = useState(false);
  const [submittingContributionGoalId, setSubmittingContributionGoalId] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  async function handleCreateGoal(
    values: SavingGoalFormValues
  ): Promise<SavingGoalFormState> {
    setIsSubmittingGoal(true);
    setPageError(null);

    try {
      const response = await fetch("/api/saving-goals", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(values)
      });

      const data = await readResponse<{ goal: SavingGoal }>(response);
      setGoals((current) => [data.goal, ...current]);
      setIsCreateModalOpen(false);

      return {
        success: true,
        message: "Saving goal creato con successo."
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Impossibile creare il goal."
      };
    } finally {
      setIsSubmittingGoal(false);
    }
  }

  async function handleAddContribution(
    goalId: string,
    values: { amount: string; note: string }
  ): Promise<GoalContributionFormState> {
    setSubmittingContributionGoalId(goalId);
    setPageError(null);

    try {
      const response = await fetch(`/api/saving-goals/${goalId}/contributions`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(values)
      });

      const data = await readResponse<{ goal: SavingGoal }>(response);
      setGoals((current) =>
        current.map((goal) => (goal.id === goalId ? data.goal : goal))
      );

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

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="secondary" className="w-fit bg-white/80 text-slate-700">
              Saving Goals
            </Badge>
            <div className="mt-3">
              <h1 className="font-display text-3xl font-semibold text-slate-950">
                Obiettivi di risparmio
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
                Crea goal con target e scadenza, monitora il progresso e aggiungi
                contributi manuali con aggiornamento immediato.
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
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {pageError}
        </div>
      ) : null}

      <section>
        <Card className="border-white/70 bg-white/85 shadow-soft backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-950 p-2 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="font-display text-2xl text-slate-950">
                  Goal dettagliati
                </CardTitle>
                <p className="text-sm text-slate-500">
                  Ogni card mostra progresso, quota mensile e raggiungibilita.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <SavingGoalsGrid
              goals={goals}
              submittingGoalId={submittingContributionGoalId}
              onAddContribution={handleAddContribution}
            />
          </CardContent>
        </Card>
      </section>

      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Nuovo saving goal"
        description="Definisci priorita, target e data obiettivo per il prossimo traguardo."
      >
        <SavingGoalForm isSubmitting={isSubmittingGoal} onSubmit={handleCreateGoal} />
      </Modal>
    </div>
  );
}
