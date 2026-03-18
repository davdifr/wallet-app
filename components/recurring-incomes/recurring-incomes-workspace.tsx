"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { useSyncSourceId } from "@/components/providers/dashboard-query-provider";
import { RecurringIncomeForm } from "@/components/recurring-incomes/recurring-income-form";
import { RecurringIncomesList } from "@/components/recurring-incomes/recurring-incomes-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { fetchJson } from "@/lib/query/fetch-json";
import { queryKeys } from "@/lib/query/query-keys";
import { publishSyncEvent } from "@/lib/query/sync-events";
import type {
  RecurringIncome,
  RecurringIncomeFormState,
  RecurringIncomeFormValues
} from "@/types/recurring-incomes";

type RecurringIncomesWorkspaceProps = {
  initialRecurringIncomes: RecurringIncome[];
};

function sortRecurringIncomes(items: RecurringIncome[]) {
  return [...items].sort((left, right) => {
    if (left.isActive !== right.isActive) {
      return left.isActive ? -1 : 1;
    }

    if (left.nextOccurrenceOn !== right.nextOccurrenceOn) {
      return left.nextOccurrenceOn.localeCompare(right.nextOccurrenceOn);
    }

    return right.createdAt.localeCompare(left.createdAt);
  });
}

export function RecurringIncomesWorkspace({
  initialRecurringIncomes
}: RecurringIncomesWorkspaceProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [recurringIncomeToDelete, setRecurringIncomeToDelete] = useState<RecurringIncome | null>(
    null
  );
  const [pageMessage, setPageMessage] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const syncSourceId = useSyncSourceId();
  const initialData = useMemo(
    () => ({ recurringIncomes: sortRecurringIncomes(initialRecurringIncomes) }),
    [initialRecurringIncomes]
  );

  const recurringIncomesQuery = useQuery({
    queryKey: queryKeys.recurringIncomes.all,
    queryFn: () =>
      fetchJson<{ recurringIncomes: RecurringIncome[] }>("/api/recurring-incomes", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store"
      }),
    initialData
  });

  const createRecurringIncomeMutation = useMutation({
    mutationFn: async (values: RecurringIncomeFormValues) =>
      fetchJson<{ recurringIncome: RecurringIncome }>("/api/recurring-incomes", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      })
  });

  const toggleRecurringIncomeMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      fetchJson<{ recurringIncome: RecurringIncome }>(`/api/recurring-incomes/${id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive })
      })
  });

  const deleteRecurringIncomeMutation = useMutation({
    mutationFn: async (id: string) =>
      fetchJson<{ recurringIncome: RecurringIncome }>(`/api/recurring-incomes/${id}`, {
        method: "DELETE",
        credentials: "same-origin"
      })
  });

  const recurringIncomes = sortRecurringIncomes(
    recurringIncomesQuery.data?.recurringIncomes ?? initialData.recurringIncomes
  );

  async function syncRecurringDomain() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringIncomes.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    ]);

    publishSyncEvent({
      id: crypto.randomUUID(),
      domain: "recurring-incomes",
      sourceId: syncSourceId,
      timestamp: Date.now()
    });
  }

  async function handleSubmit(
    values: RecurringIncomeFormValues
  ): Promise<RecurringIncomeFormState> {
    setPageError(null);
    setPageMessage(null);

    try {
      const data = await createRecurringIncomeMutation.mutateAsync(values);

      queryClient.setQueryData<{ recurringIncomes: RecurringIncome[] }>(
        queryKeys.recurringIncomes.all,
        (current) => ({
          recurringIncomes: sortRecurringIncomes([
            data.recurringIncome,
            ...(current?.recurringIncomes ?? [])
          ])
        })
      );

      setIsCreateModalOpen(false);
      await syncRecurringDomain();

      return {
        success: true,
        message: "Entrata ricorrente creata."
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Impossibile creare l'entrata ricorrente."
      };
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    setLoadingId(id);
    setPageError(null);
    setPageMessage(null);

    try {
      const data = await toggleRecurringIncomeMutation.mutateAsync({ id, isActive });

      queryClient.setQueryData<{ recurringIncomes: RecurringIncome[] }>(
        queryKeys.recurringIncomes.all,
        (current) => ({
          recurringIncomes: sortRecurringIncomes(
            (current?.recurringIncomes ?? []).map((item) =>
              item.id === id ? data.recurringIncome : item
            )
          )
        })
      );

      await syncRecurringDomain();
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Impossibile aggiornare la ricorrenza."
      );
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDeleteRecurringIncome() {
    if (!recurringIncomeToDelete) {
      return;
    }

    const target = recurringIncomeToDelete;
    setDeletingId(target.id);
    setPageError(null);
    setPageMessage(null);

    try {
      await deleteRecurringIncomeMutation.mutateAsync(target.id);

      queryClient.setQueryData<{ recurringIncomes: RecurringIncome[] }>(
        queryKeys.recurringIncomes.all,
        (current) => ({
          recurringIncomes: (current?.recurringIncomes ?? []).filter(
            (item) => item.id !== target.id
          )
        })
      );

      setPageMessage("Entrata ricorrente eliminata. Le transazioni gia generate restano invariate.");
      setRecurringIncomeToDelete(null);
      await syncRecurringDomain();
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Impossibile eliminare l'entrata ricorrente."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <Badge variant="secondary" className="w-fit bg-white/80 text-slate-700">
            Recurring Incomes
          </Badge>
          <div>
            <h1 className="font-display text-3xl font-semibold text-slate-950">
              Entrate ricorrenti
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
              Crea entrate settimanali, mensili o annuali e materializza le occorrenze
              mancanti nelle transazioni senza duplicati.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" className="w-full sm:w-auto" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Nuova entrata
          </Button>
        </div>
      </section>

      {pageError ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {pageError}
        </div>
      ) : null}

      {recurringIncomesQuery.error instanceof Error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {recurringIncomesQuery.error.message}
        </div>
      ) : null}

      {pageMessage ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
          {pageMessage}
        </div>
      ) : null}

      <section>
        <RecurringIncomesList
          recurringIncomes={recurringIncomes}
          loadingId={loadingId}
          deletingId={deletingId}
          onDelete={(recurringIncome) => {
            setPageError(null);
            setPageMessage(null);
            setRecurringIncomeToDelete(recurringIncome);
          }}
          onToggle={(id, isActive) => {
            void handleToggle(id, isActive);
          }}
        />
      </section>

      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Nuova entrata ricorrente"
        description="Configura una ricorrenza settimanale, mensile o annuale sincronizzata con le transazioni."
      >
        <RecurringIncomeForm
          isSubmitting={createRecurringIncomeMutation.isPending}
          onSubmit={handleSubmit}
        />
      </Modal>

      <Modal
        open={recurringIncomeToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRecurringIncomeToDelete(null);
          }
        }}
        title="Conferma eliminazione"
        description="La ricorrenza verra rimossa senza cancellare retroattivamente le transazioni gia materializzate."
      >
        {recurringIncomeToDelete ? (
          <div className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 px-5 py-4 text-sm text-slate-600">
              <p className="font-medium text-slate-900">
                {recurringIncomeToDelete.category} · {recurringIncomeToDelete.description}
              </p>
              <p className="mt-1">
                Fonte {recurringIncomeToDelete.source} · prossimo evento{" "}
                {recurringIncomeToDelete.nextOccurrenceOn}
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRecurringIncomeToDelete(null)}
                disabled={deletingId === recurringIncomeToDelete.id}
              >
                Annulla
              </Button>
              <Button
                type="button"
                className="bg-rose-600 text-white hover:bg-rose-700"
                onClick={() => void handleDeleteRecurringIncome()}
                disabled={deletingId === recurringIncomeToDelete.id}
              >
                {deletingId === recurringIncomeToDelete.id ? "Elimino..." : "Elimina"}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
