"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { savingGoalSchema } from "@/lib/validations/saving-goal";
import { cn } from "@/lib/utils";
import type { SavingGoalFormState, SavingGoalFormValues } from "@/types/saving-goals";

const emptyValues: SavingGoalFormValues = {
  title: "",
  description: "",
  targetAmount: "",
  targetDate: "",
  priority: "medium"
};

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return <p className="text-xs text-muted-foreground">{errors[0]}</p>;
}

type SavingGoalFormProps = {
  isSubmitting?: boolean;
  onSubmit: (values: SavingGoalFormValues) => Promise<SavingGoalFormState>;
};

export function SavingGoalForm({
  isSubmitting = false,
  onSubmit
}: SavingGoalFormProps) {
  const [values, setValues] = useState<SavingGoalFormValues>(emptyValues);
  const [state, setState] = useState<SavingGoalFormState>({ success: false });

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();

        const parsed = savingGoalSchema.safeParse(values);

        if (!parsed.success) {
          setState({
            success: false,
            message: "Controlla i campi evidenziati.",
            errors: parsed.error.flatten().fieldErrors
          });
          return;
        }

        const nextState = await onSubmit(parsed.data);
        setState(nextState);

        if (nextState.success) {
          setValues(emptyValues);
        }
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="title">Titolo</Label>
        <Input
          id="title"
          name="title"
          placeholder="Vacanza estiva, fondo emergenza..."
          value={values.title}
          onChange={(event) =>
            setValues((current) => ({ ...current, title: event.target.value }))
          }
        />
        <FieldError errors={state.errors?.title} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrizione</Label>
        <Input
          id="description"
          name="description"
          placeholder="Facoltativa"
          value={values.description}
          onChange={(event) =>
            setValues((current) => ({ ...current, description: event.target.value }))
          }
        />
        <FieldError errors={state.errors?.description} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="targetAmount">Target</Label>
          <Input
            id="targetAmount"
            name="targetAmount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={values.targetAmount}
            onChange={(event) =>
              setValues((current) => ({ ...current, targetAmount: event.target.value }))
            }
          />
          <FieldError errors={state.errors?.targetAmount} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priorita</Label>
          <Select
            id="priority"
            name="priority"
            value={values.priority}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                priority:
                  event.target.value === "low" || event.target.value === "high"
                    ? event.target.value
                    : "medium"
              }))
            }
          >
            <option value="low">Bassa</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </Select>
          <FieldError errors={state.errors?.priority} />
        </div>
      </div>

      <div
        className={cn(
          "rounded-2xl border px-4 py-3 text-sm",
          state.success
            ? "border-input bg-muted text-foreground"
            : state.message
              ? "border-input bg-muted text-foreground"
              : "hidden"
        )}
      >
        {state.message}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creazione in corso..." : "Crea goal"}
      </Button>
    </form>
  );
}
