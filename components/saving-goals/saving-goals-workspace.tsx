"use client";

import { useState } from "react";
import { Sparkles, Target } from "lucide-react";

import { SavingGoalForm } from "@/components/saving-goals/saving-goal-form";
import { SavingGoalsGrid } from "@/components/saving-goals/saving-goals-grid";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        <Badge variant="secondary" className="w-fit bg-white/80 text-slate-700">
          Saving Goals
        </Badge>
        <div>
          <h1 className="font-display text-3xl font-semibold text-slate-950">
            Obiettivi di risparmio
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
            Crea goal con target e scadenza, monitora il progresso e aggiungi
            contributi manuali con aggiornamento immediato.
          </p>
        </div>
      </section>

      {pageError ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {pageError}
        </div>
      ) : null}

      <section className="grid items-start gap-6 xl:grid-cols-[0.95fr_1.25fr]">
        <Card className="self-start border-white/70 bg-white/85 shadow-soft backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-950 p-2 text-white">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="font-display text-2xl text-slate-950">
                  Nuovo goal
                </CardTitle>
                <p className="text-sm text-slate-500">
                  Definisci priorita, target e data obiettivo.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <SavingGoalForm isSubmitting={isSubmittingGoal} onSubmit={handleCreateGoal} />
          </CardContent>
        </Card>

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
    </div>
  );
}
