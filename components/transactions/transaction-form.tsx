"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getCategoriesForScope,
  getFallbackCategory,
  isValidCategorySlug,
  resolveLegacyCategory
} from "@/lib/categories/catalog";
import { transactionSchema } from "@/lib/validations/transaction";
import { cn } from "@/lib/utils";
import type {
  Transaction,
  TransactionFormState,
  TransactionFormValues
} from "@/types/transactions";

type TransactionFormProps = {
  initialValues: Transaction | null;
  isSubmitting?: boolean;
  onCancelEdit: () => void;
  onSubmit: (values: TransactionFormValues) => Promise<TransactionFormState>;
};

const emptyValues: TransactionFormValues = {
  amount: "",
  date: "",
  category: "",
  categorySlug: "groceries",
  note: "",
  source: "",
  type: "expense"
};

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return <p className="text-xs text-red-600">{errors[0]}</p>;
}

function mapTransactionToFormValues(transaction: Transaction | null): TransactionFormValues {
  if (!transaction) {
    return emptyValues;
  }

  return {
    id: transaction.id,
    amount: transaction.amount.toString(),
    date: transaction.date,
    category: transaction.category,
    categorySlug: transaction.categorySlug ?? resolveLegacyCategory(transaction.category, transaction.type).slug,
    note: transaction.note,
    source: transaction.source,
    type: transaction.type
  };
}

export function TransactionForm({
  initialValues,
  isSubmitting = false,
  onCancelEdit,
  onSubmit
}: TransactionFormProps) {
  const isEditing = Boolean(initialValues);
  const [values, setValues] = useState<TransactionFormValues>(
    mapTransactionToFormValues(initialValues)
  );
  const [state, setState] = useState<TransactionFormState>({ success: false });

  useEffect(() => {
    setValues(mapTransactionToFormValues(initialValues));
    setState({ success: false });
  }, [initialValues]);

  const categoryOptions = getCategoriesForScope(values.type);

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();

        const parsed = transactionSchema.safeParse(values);

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

        if (nextState.success && !isEditing) {
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
            placeholder="0.00"
            value={values.amount}
            onChange={(event) =>
              setValues((current) => ({ ...current, amount: event.target.value }))
            }
          />
          <FieldError errors={state.errors?.amount} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Data</Label>
          <Input
            id="date"
            name="date"
            type="date"
            value={values.date}
            onChange={(event) =>
              setValues((current) => ({ ...current, date: event.target.value }))
            }
          />
          <FieldError errors={state.errors?.date} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="type">Tipo</Label>
          <Select
            id="type"
            name="type"
            value={values.type}
            onChange={(event) =>
              setValues((current) => {
                const nextType = event.target.value === "income" ? "income" : "expense";
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
            <option value="expense">Spesa</option>
            <option value="income">Entrata</option>
          </Select>
          <FieldError errors={state.errors?.type} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>Categoria</Label>
          {initialValues?.isLegacyCategoryFallback ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Categoria storica non mappata: <strong>{initialValues.category}</strong>. Se salvi
              la transazione verra riclassificata in <strong>Altro</strong> o in una categoria
              del catalogo che scegli qui sotto.
            </div>
          ) : null}
          <input type="hidden" name="categorySlug" value={values.categorySlug ?? ""} />
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
                      ? "flex items-center gap-2 rounded-2xl border border-slate-950 bg-slate-950 px-3 py-3 text-left text-white"
                      : "flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-slate-700"
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="source">Fonte</Label>
        <Input
          id="source"
          name="source"
          placeholder="Carta, banca, cliente, contanti..."
          value={values.source}
          onChange={(event) =>
            setValues((current) => ({ ...current, source: event.target.value }))
          }
        />
        <FieldError errors={state.errors?.source} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Nota</Label>
        <Textarea
          id="note"
          name="note"
          placeholder="Aggiungi un contesto utile per questa operazione"
          value={values.note}
          onChange={(event) =>
            setValues((current) => ({ ...current, note: event.target.value }))
          }
        />
        <FieldError errors={state.errors?.note} />
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

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting
            ? "Salvataggio in corso..."
            : isEditing
              ? "Salva modifiche"
              : "Crea transazione"}
        </Button>
        {isEditing ? (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onCancelEdit}
            disabled={isSubmitting}
          >
            Annulla modifica
          </Button>
        ) : null}
      </div>
    </form>
  );
}
