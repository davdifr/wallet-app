"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { useSyncSourceId } from "@/components/providers/dashboard-query-provider";
import { TransactionsList } from "@/components/transactions/transactions-list";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { fetchJson } from "@/lib/query/fetch-json";
import { invalidateDomainQueries } from "@/lib/query/invalidate-domain-cache";
import { queryKeys } from "@/lib/query/query-keys";
import { publishSyncEvent } from "@/lib/query/sync-events";
import {
  removeTransactionFromCache,
  upsertTransactionInCache,
  type TransactionsListCache
} from "@/lib/query/transactions-cache";
import type {
  Transaction,
  TransactionCategoryOption,
  TransactionFilters,
  TransactionFormState,
  TransactionFormValues
} from "@/types/transactions";

const TransactionForm = dynamic(
  () => import("@/components/transactions/transaction-form").then((mod) => mod.TransactionForm)
);

type TransactionsWorkspaceProps = {
  availableMonths: string[];
  categories: TransactionCategoryOption[];
  initialEditingTransaction: Transaction | null;
  initialFilters: TransactionFilters;
  initialTransactions: Transaction[];
};

type TransactionsApiResponse = {
  availableMonths: string[];
  categories: TransactionCategoryOption[];
  transactions: Transaction[];
};

function buildTransactionsSearchParams(filters: TransactionFilters) {
  const searchParams = new URLSearchParams();

  if (filters.month) {
    searchParams.set("month", filters.month);
  }

  if (filters.category) {
    searchParams.set("category", filters.category);
  }

  if (filters.type) {
    searchParams.set("type", filters.type);
  }

  return searchParams;
}

export function TransactionsWorkspace({
  availableMonths: initialAvailableMonths,
  categories: initialCategories,
  initialEditingTransaction,
  initialFilters,
  initialTransactions
}: TransactionsWorkspaceProps) {
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(
    initialEditingTransaction
  );
  const [isComposerOpen, setIsComposerOpen] = useState(Boolean(initialEditingTransaction));
  const [listError, setListError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const syncSourceId = useSyncSourceId();
  const initialData = useMemo<TransactionsApiResponse>(
    () => ({
      transactions: initialTransactions,
      categories: initialCategories,
      availableMonths: initialAvailableMonths
    }),
    [initialAvailableMonths, initialCategories, initialTransactions]
  );

  const transactionsQuery = useQuery({
    queryKey: queryKeys.transactions.list(filters),
    queryFn: () =>
      fetchJson<TransactionsApiResponse>(
        `/api/transactions?${buildTransactionsSearchParams(filters).toString()}`,
        {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store"
        }
      ),
    initialData:
      filters.month === initialFilters.month &&
      filters.category === initialFilters.category &&
      filters.type === initialFilters.type
        ? initialData
        : undefined,
    placeholderData: (previousData) => previousData
  });

  const transactionData = transactionsQuery.data ?? initialData;

  const saveTransactionMutation = useMutation({
    mutationFn: async (values: TransactionFormValues) => {
      const url = values.id ? `/api/transactions/${values.id}` : "/api/transactions";
      const method = values.id ? "PATCH" : "POST";

      return fetchJson<{ transaction: Transaction }>(url, {
        method,
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
    }
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (transactionId: string) =>
      fetchJson<{ transaction: Transaction }>(`/api/transactions/${transactionId}`, {
        method: "DELETE",
        credentials: "same-origin"
      })
  });

  function updateTransactionQueries(
    updater: (cache: TransactionsListCache, filters: TransactionFilters) => TransactionsListCache
  ) {
    const transactionsQueries = queryClient.getQueriesData<TransactionsApiResponse>({
      queryKey: queryKeys.transactions.all
    });

    for (const [queryKey, cache] of transactionsQueries) {
      if (!cache || !Array.isArray(queryKey) || queryKey.length < 2) {
        continue;
      }

      const [, queryFilters] = queryKey;

      if (!queryFilters || typeof queryFilters !== "object") {
        continue;
      }

      queryClient.setQueryData<TransactionsApiResponse>(
        queryKey,
        updater(cache, queryFilters as TransactionFilters)
      );
    }
  }

  async function refreshTransactions(nextFilters: TransactionFilters) {
    setListError(null);
    setFilters(nextFilters);
  }

  async function syncTransactionDomain() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      queryClient.invalidateQueries({ queryKey: queryKeys.piggyBank.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.savingGoals.all })
    ]);

    publishSyncEvent({
      id: crypto.randomUUID(),
      domain: "transactions",
      sourceId: syncSourceId,
      timestamp: Date.now()
    });
  }

  async function handleSubmit(values: TransactionFormValues): Promise<TransactionFormState> {
    setListError(null);

    try {
      const { transaction } = await saveTransactionMutation.mutateAsync(values);
      updateTransactionQueries((cache, queryFilters) =>
        upsertTransactionInCache(cache, transaction, queryFilters)
      );
      setEditingTransaction(null);
      setIsComposerOpen(false);
      await syncTransactionDomain();

      return {
        success: true,
        message: values.id ? "Transazione aggiornata." : "Transazione creata."
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Impossibile salvare la transazione."
      };
    }
  }

  async function handleDelete(transactionId: string) {
    setDeletingId(transactionId);
    setListError(null);

    try {
      await deleteTransactionMutation.mutateAsync(transactionId);
      updateTransactionQueries((cache) => removeTransactionFromCache(cache, transactionId));

      if (editingTransaction?.id === transactionId) {
        setEditingTransaction(null);
      }

      await syncTransactionDomain();
    } catch (error) {
      setListError(
        error instanceof Error
          ? error.message
          : "Impossibile eliminare la transazione."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-7">
      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-[2.2rem] font-semibold tracking-tight text-foreground">
              Entrate e spese
            </h1>
          </div>

          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => {
              setEditingTransaction(null);
              setIsComposerOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Nuovo movimento
          </Button>
        </div>
      </section>

      {listError ? (
        <div className="rounded-[1.5rem] bg-secondary px-5 py-4 text-sm text-foreground">
          {listError}
        </div>
      ) : null}

      {transactionsQuery.error instanceof Error ? (
        <div className="rounded-[1.5rem] bg-secondary px-5 py-4 text-sm text-foreground">
          {transactionsQuery.error.message}
        </div>
      ) : null}

      <section>
        <TransactionsList
          availableMonths={transactionData.availableMonths}
          categories={transactionData.categories}
          deletingId={deletingId}
          filters={filters}
          isLoading={transactionsQuery.isFetching}
          transactions={transactionData.transactions}
          onApplyFilters={(nextFilters) => {
            void refreshTransactions(nextFilters);
          }}
          onDelete={(transactionId) => {
            void handleDelete(transactionId);
          }}
          onEdit={(transaction) => {
            setEditingTransaction(transaction);
            setIsComposerOpen(true);
          }}
        />
      </section>

      <Modal
        open={isComposerOpen}
        onOpenChange={(open) => {
          setIsComposerOpen(open);
          if (!open) {
            setEditingTransaction(null);
          }
        }}
        title={editingTransaction ? "Modifica transazione" : "Nuova transazione"}
        description={
          editingTransaction
            ? "Aggiorna i dati del movimento e la lista si allinea subito."
            : "Inserisci un nuovo movimento di entrata o uscita."
        }
      >
        <TransactionForm
          initialValues={editingTransaction}
          isSubmitting={saveTransactionMutation.isPending}
          onCancelEdit={() => {
            setEditingTransaction(null);
            setIsComposerOpen(false);
          }}
          onSubmit={handleSubmit}
        />
      </Modal>
    </div>
  );
}
