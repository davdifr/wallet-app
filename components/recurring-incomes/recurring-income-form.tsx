"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { recurringIncomeSchema } from "@/lib/validations/recurring-income";
import { cn } from "@/lib/utils";
import type {
  RecurringIncomeFormState,
  RecurringIncomeFormValues
} from "@/types/recurring-incomes";

const emptyValues: RecurringIncomeFormValues = {
  amount: "",
  category: "",
  description: "",
  source: "",
  frequency: "monthly",
  startsOn: "",
  endsOn: ""
};

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return <p className="text-xs text-red-600">{errors[0]}</p>;
}

type RecurringIncomeFormProps = {
  isSubmitting?: boolean;
  onSubmit: (values: RecurringIncomeFormValues) => Promise<RecurringIncomeFormState>;
};

export function RecurringIncomeForm({
  isSubmitting = false,
  onSubmit
}: RecurringIncomeFormProps) {
  const [values, setValues] = useState<RecurringIncomeFormValues>(emptyValues);
  const [state, setState] = useState<RecurringIncomeFormState>({ success: false });

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();

        const parsed = recurringIncomeSchema.safeParse(values);

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
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">Importo</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            value={values.amount}
            onChange={(event) =>
              setValues((current) => ({ ...current, amount: event.target.value }))
            }
          />
          <FieldError errors={state.errors?.amount} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequency">Frequenza</Label>
          <Select
            id="frequency"
            name="frequency"
            value={values.frequency}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                frequency:
                  event.target.value === "weekly" ||
                  event.target.value === "yearly"
                    ? event.target.value
                    : "monthly"
              }))
            }
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </Select>
          <FieldError errors={state.errors?.frequency} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Input
            id="category"
            name="category"
            placeholder="Salary, Freelance..."
            value={values.category}
            onChange={(event) =>
              setValues((current) => ({ ...current, category: event.target.value }))
            }
          />
          <FieldError errors={state.errors?.category} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="source">Fonte</Label>
          <Input
            id="source"
            name="source"
            placeholder="Datore, cliente, banca..."
            value={values.source}
            onChange={(event) =>
              setValues((current) => ({ ...current, source: event.target.value }))
            }
          />
          <FieldError errors={state.errors?.source} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrizione</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Descrivi l'entrata ricorrente e come verra registrata"
          className="min-h-24"
          value={values.description}
          onChange={(event) =>
            setValues((current) => ({ ...current, description: event.target.value }))
          }
        />
        <FieldError errors={state.errors?.description} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startsOn">Inizio</Label>
          <Input
            id="startsOn"
            name="startsOn"
            type="date"
            value={values.startsOn}
            onChange={(event) =>
              setValues((current) => ({ ...current, startsOn: event.target.value }))
            }
          />
          <FieldError errors={state.errors?.startsOn} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endsOn">Fine opzionale</Label>
          <Input
            id="endsOn"
            name="endsOn"
            type="date"
            value={values.endsOn}
            onChange={(event) =>
              setValues((current) => ({ ...current, endsOn: event.target.value }))
            }
          />
          <FieldError errors={state.errors?.endsOn} />
        </div>
      </div>

      <div
        className={cn(
          "rounded-2xl border px-4 py-3 text-sm",
          state.success
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : state.message
              ? "border-red-200 bg-red-50 text-red-700"
              : "hidden"
        )}
      >
        {state.message}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creazione in corso..." : "Crea recurring income"}
      </Button>
    </form>
  );
}
