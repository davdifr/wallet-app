"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { goalContributionSchema } from "@/lib/validations/saving-goal";
import { cn } from "@/lib/utils";
import type {
  GoalContributionFormState,
  GoalContributionFormValues
} from "@/types/saving-goals";

type GoalContributionFormProps = {
  goalId: string;
  isSubmitting?: boolean;
  onSubmit: (values: GoalContributionFormValues) => Promise<GoalContributionFormState>;
};

export function GoalContributionForm({
  goalId,
  isSubmitting = false,
  onSubmit
}: GoalContributionFormProps) {
  const [values, setValues] = useState<GoalContributionFormValues>({
    goalId,
    amount: "",
    note: ""
  });
  const [state, setState] = useState<GoalContributionFormState>({ success: false });

  return (
    <form
      className="space-y-3 rounded-3xl border border-input bg-card p-4"
      onSubmit={async (event) => {
        event.preventDefault();

        const parsed = goalContributionSchema.safeParse(values);

        if (!parsed.success) {
          setState({
            success: false,
            message: "Controlla il contributo inserito.",
            errors: parsed.error.flatten().fieldErrors
          });
          return;
        }

        const nextState = await onSubmit(parsed.data);
        setState(nextState);

        if (nextState.success) {
          setValues({
            goalId,
            amount: "",
            note: ""
          });
        }
      }}
    >
      <div className="grid gap-3 sm:grid-cols-[0.8fr_1.2fr] sm:items-start">
        <Input
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Importo"
          value={values.amount}
          onChange={(event) =>
            setValues((current) => ({ ...current, amount: event.target.value }))
          }
        />
        <Textarea
          name="note"
          rows={1}
          className="min-h-11 resize-none py-3"
          placeholder="Nota opzionale sul contributo"
          value={values.note}
          onChange={(event) =>
            setValues((current) => ({ ...current, note: event.target.value }))
          }
        />
      </div>

      <div
        className={cn(
          "rounded-2xl border px-3 py-2 text-xs",
          state.success
            ? "border-input bg-muted text-foreground"
            : state.message
              ? "border-input bg-muted text-foreground"
              : "hidden"
        )}
      >
        {state.message}
      </div>

      <Button type="submit" size="sm" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Aggiunta..." : "Aggiungi contributo"}
      </Button>
    </form>
  );
}
