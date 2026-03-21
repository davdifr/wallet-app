"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getCategoriesForScope,
  getFallbackCategory,
  isValidCategorySlug
} from "@/lib/categories/catalog";
import { recurringIncomeSchema } from "@/lib/validations/recurring-income";
import { cn } from "@/lib/utils";
import type {
  RecurringIncomeFormState,
  RecurringIncomeFormValues
} from "@/types/recurring-incomes";

const emptyValues: RecurringIncomeFormValues = {
  amount: "",
  type: "income",
  category: "",
  categorySlug: "salary",
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

  return <p className="text-xs text-muted-foreground">{errors[0]}</p>;
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
  const categoryOptions = getCategoriesForScope(values.type);

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
          <Label htmlFor="type">Tipo</Label>
          <Select
            id="type"
            name="type"
            value={values.type}
            onChange={(event) =>
              setValues((current) => {
                const nextType = event.target.value === "expense" ? "expense" : "income";
                const nextCategorySlug = isValidCategorySlug(current.categorySlug, nextType)
                  ? current.categorySlug
                  : getFallbackCategory(nextType).slug;

                return {
                  ...current,
                  type: nextType,
                  categorySlug: nextCategorySlug
                };
              })
            }
          >
            <option value="income">Entrata</option>
            <option value="expense">Spesa</option>
          </Select>
          <FieldError errors={state.errors?.type} />
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
            <option value="weekly">Settimanale</option>
            <option value="monthly">Mensile</option>
            <option value="yearly">Annuale</option>
          </Select>
          <FieldError errors={state.errors?.frequency} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Categoria</Label>
          <input type="hidden" name="categorySlug" value={values.categorySlug} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {categoryOptions.map((category) => {
              const Icon = category.icon;
              const isSelected = values.categorySlug === category.slug;

              return (
                <button
                  key={category.slug}
                  type="button"
                  onClick={() =>
                    setValues((current) => ({
                      ...current,
                      categorySlug: category.slug
                    }))
                  }
                  className={
                    isSelected
                      ? "flex items-center gap-2 rounded-2xl border border-input bg-muted px-3 py-3 text-left text-foreground"
                      : "flex items-center gap-2 rounded-2xl border border-input bg-background px-3 py-3 text-left text-foreground"
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium leading-tight">{category.label}</span>
                </button>
              );
            })}
          </div>
          <FieldError errors={state.errors?.categorySlug} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="source">Fonte</Label>
          <Input
            id="source"
            name="source"
            placeholder={
              values.type === "income"
                ? "Datore, cliente, banca..."
                : "Carta, banca, fornitore..."
            }
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
          placeholder={
            values.type === "income"
              ? "Descrivi la ricorrenza di entrata e come verra registrata"
              : "Descrivi la ricorrenza di spesa e come verra registrata"
          }
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
            ? "border-input bg-muted text-foreground"
            : state.message
              ? "border-input bg-muted text-foreground"
              : "hidden"
        )}
      >
        {state.message}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creazione in corso..." : "Crea ricorrenza"}
      </Button>
    </form>
  );
}
