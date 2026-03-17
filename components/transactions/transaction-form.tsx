"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { transactionSchema } from "@/lib/validations/transaction";
import { cn } from "@/lib/utils";
import type {
  Transaction,
  TransactionFormState,
  TransactionFormValues
} from "@/types/transactions";

type TransactionFormProps = {
  categories: string[];
  initialValues: Transaction | null;
  isSubmitting?: boolean;
  onCancelEdit: () => void;
  onSubmit: (values: TransactionFormValues) => Promise<TransactionFormState>;
};

const emptyValues: TransactionFormValues = {
  amount: "",
  date: "",
  category: "",
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
    note: transaction.note,
    source: transaction.source,
    type: transaction.type
  };
}

export function TransactionForm({
  categories,
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
              setValues((current) => ({
                ...current,
                type: event.target.value === "income" ? "income" : "expense"
              }))
            }
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </Select>
          <FieldError errors={state.errors?.type} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Input
            id="category"
            name="category"
            list="transaction-categories"
            placeholder="Groceries, Salary, Rent..."
            value={values.category}
            onChange={(event) =>
              setValues((current) => ({ ...current, category: event.target.value }))
            }
          />
          <datalist id="transaction-categories">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
          <FieldError errors={state.errors?.category} />
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
