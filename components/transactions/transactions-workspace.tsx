"use client";

import { startTransition, useState } from "react";

import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionsList } from "@/components/transactions/transactions-list";
import type {
  Transaction,
  TransactionFilters,
  TransactionFormState,
  TransactionFormValues
} from "@/types/transactions";

type TransactionsWorkspaceProps = {
  availableMonths: string[];
  categories: string[];
  initialEditingTransaction: Transaction | null;
  initialFilters: TransactionFilters;
  initialTransactions: Transaction[];
};

type TransactionsApiResponse = {
  availableMonths: string[];
  categories: string[];
  transactions: Transaction[];
};

function mergeStringValue(values: string[], nextValue: string) {
  const trimmedValue = nextValue.trim();

  if (!trimmedValue) {
    return values;
  }

  return Array.from(new Set([...values, trimmedValue])).sort((left, right) =>
    left.localeCompare(right)
  );
}

function syncAvailableMonths(months: string[], date: string) {
  const nextMonth = date.slice(0, 7);

  if (!nextMonth) {
    return months;
  }

  return Array.from(new Set([...months, nextMonth])).sort((left, right) =>
    right.localeCompare(left)
  );
}

function transactionMatchesFilters(
  transaction: Transaction,
  filters: TransactionFilters
) {
  if (filters.category && transaction.category !== filters.category) {
    return false;
  }

  if (filters.type && filters.type !== "all" && transaction.type !== filters.type) {
    return false;
  }

  if (filters.month && transaction.date.slice(0, 7) !== filters.month) {
    return false;
  }

  return true;
}

function sortTransactions(transactions: Transaction[]) {
  return [...transactions].sort((left, right) => {
    if (left.date !== right.date) {
      return right.date.localeCompare(left.date);
    }

    return right.createdAt.localeCompare(left.createdAt);
  });
}

async function readResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { message?: string };

  if (!response.ok) {
    throw new Error(data.message ?? "Richiesta non riuscita.");
  }

  return data;
}

export function TransactionsWorkspace({
  availableMonths: initialAvailableMonths,
  categories: initialCategories,
  initialEditingTransaction,
  initialFilters,
  initialTransactions
}: TransactionsWorkspaceProps) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters);
  const [categories, setCategories] = useState(initialCategories);
  const [availableMonths, setAvailableMonths] = useState(initialAvailableMonths);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(
    initialEditingTransaction
  );
  const [listError, setListError] = useState<string | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function refreshTransactions(nextFilters: TransactionFilters) {
    setIsFiltering(true);
    setListError(null);

    try {
      const searchParams = new URLSearchParams();

      if (nextFilters.month) {
        searchParams.set("month", nextFilters.month);
      }

      if (nextFilters.category) {
        searchParams.set("category", nextFilters.category);
      }

      if (nextFilters.type) {
        searchParams.set("type", nextFilters.type);
      }

      const response = await fetch(`/api/transactions?${searchParams.toString()}`, {
        method: "GET",
        credentials: "same-origin",
        headers: {
          Accept: "application/json"
        },
        cache: "no-store"
      });

      const data = await readResponse<TransactionsApiResponse>(response);
      setTransactions(data.transactions);
      setCategories(data.categories);
      setAvailableMonths(data.availableMonths);
      setFilters(nextFilters);
    } catch (error) {
      setListError(
        error instanceof Error
          ? error.message
          : "Impossibile aggiornare le transazioni."
      );
    } finally {
      setIsFiltering(false);
    }
  }

  async function handleSubmit(values: TransactionFormValues): Promise<TransactionFormState> {
    setIsSubmitting(true);
    setListError(null);

    const optimisticTransaction: Transaction = {
      id: values.id ?? `temp-${crypto.randomUUID()}`,
      amount: Number(values.amount),
      date: values.date,
      category: values.category,
      note: values.note,
      source: values.source,
      type: values.type,
      createdAt: new Date().toISOString()
    };

    const previousTransactions = transactions;
    const previousEditingTransaction = editingTransaction;
    const shouldShow = transactionMatchesFilters(optimisticTransaction, filters);

    if (values.id) {
      setTransactions((current) =>
        sortTransactions(
          current
            .map((item) => (item.id === values.id ? optimisticTransaction : item))
            .filter((item) => (item.id === values.id ? shouldShow : true))
        )
      );
    } else if (shouldShow) {
      setTransactions((current) => sortTransactions([optimisticTransaction, ...current]));
    }

    setCategories((current) => mergeStringValue(current, values.category));
    setAvailableMonths((current) => syncAvailableMonths(current, values.date));

    try {
      const response = await fetch(
        values.id ? `/api/transactions/${values.id}` : "/api/transactions",
        {
          method: values.id ? "PATCH" : "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify(values)
        }
      );

      const data = await readResponse<{ transaction: Transaction } & TransactionFormState>(
        response
      );
      const savedTransaction = data.transaction;

      setTransactions((current) => {
        const withoutOptimistic = current.filter(
          (item) => item.id !== optimisticTransaction.id && item.id !== savedTransaction.id
        );

        if (!transactionMatchesFilters(savedTransaction, filters)) {
          return sortTransactions(withoutOptimistic);
        }

        return sortTransactions([savedTransaction, ...withoutOptimistic]);
      });

      setEditingTransaction(null);

      startTransition(() => {
        void refreshTransactions(filters);
      });

      return {
        success: true,
        message: values.id ? "Transazione aggiornata." : "Transazione creata."
      };
    } catch (error) {
      setTransactions(previousTransactions);
      setEditingTransaction(previousEditingTransaction);

      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Impossibile salvare la transazione."
      };
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(transactionId: string) {
    const previousTransactions = transactions;
    const deletedTransaction = previousTransactions.find((item) => item.id === transactionId);

    if (!deletedTransaction) {
      return;
    }

    setDeletingId(transactionId);
    setListError(null);
    setTransactions((current) => current.filter((item) => item.id !== transactionId));

    if (editingTransaction?.id === transactionId) {
      setEditingTransaction(null);
    }

    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "DELETE",
        credentials: "same-origin",
        headers: {
          Accept: "application/json"
        }
      });

      await readResponse<{ transaction: Transaction }>(response);
    } catch (error) {
      setTransactions(previousTransactions);
      setListError(
        error instanceof Error
          ? error.message
          : "Impossibile eliminare la transazione."
      );

      if (editingTransaction?.id === transactionId) {
        setEditingTransaction(deletedTransaction);
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-slate-950">
            Entrate e spese
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">
            Gestisci le transazioni del wallet con aggiornamenti immediati, filtri fluidi
            e sincronizzazione in background.
          </p>
        </div>
      </section>

      {listError ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {listError}
        </div>
      ) : null}

      <section className="grid items-start gap-6 xl:grid-cols-[0.95fr_1.25fr]">
        <div className="self-start rounded-3xl border border-white/70 bg-white/85 shadow-soft backdrop-blur">
          <div className="border-b border-slate-100 px-6 py-6">
            <h2 className="font-display text-2xl text-slate-950">
              {editingTransaction ? "Modifica transazione" : "Nuova transazione"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {editingTransaction
                ? "Aggiorna i dati: la lista si allinea subito."
                : "Inserisci un movimento di entrata o uscita."}
            </p>
          </div>
          <div className="px-6 py-6">
            <TransactionForm
              categories={categories}
              initialValues={editingTransaction}
              isSubmitting={isSubmitting}
              onCancelEdit={() => setEditingTransaction(null)}
              onSubmit={handleSubmit}
            />
          </div>
        </div>

        <TransactionsList
          availableMonths={availableMonths}
          categories={categories}
          deletingId={deletingId}
          filters={filters}
          isLoading={isFiltering}
          transactions={transactions}
          onApplyFilters={(nextFilters) => {
            void refreshTransactions(nextFilters);
          }}
          onDelete={(transactionId) => {
            void handleDelete(transactionId);
          }}
          onEdit={(transaction) => setEditingTransaction(transaction)}
        />
      </section>
    </div>
  );
}
