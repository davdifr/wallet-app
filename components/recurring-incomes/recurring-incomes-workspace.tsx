"use client";

import { useState } from "react";
import { Plus, RefreshCcw } from "lucide-react";

import { RecurringIncomeForm } from "@/components/recurring-incomes/recurring-income-form";
import { RecurringIncomesList } from "@/components/recurring-incomes/recurring-incomes-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type {
  MaterializeRecurringIncomesResult,
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

async function readResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { message?: string };

  if (!response.ok) {
    throw new Error(data.message ?? "Richiesta non riuscita.");
  }

  return data;
}

export function RecurringIncomesWorkspace({
  initialRecurringIncomes
}: RecurringIncomesWorkspaceProps) {
  const [recurringIncomes, setRecurringIncomes] = useState(
    sortRecurringIncomes(initialRecurringIncomes)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isMaterializing, setIsMaterializing] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [recurringIncomeToDelete, setRecurringIncomeToDelete] = useState<RecurringIncome | null>(
    null
  );
  const [pageMessage, setPageMessage] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  async function reloadRecurringIncomes() {
    const response = await fetch("/api/recurring-incomes", {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      cache: "no-store"
    });

    const data = await readResponse<{ recurringIncomes: RecurringIncome[] }>(response);
    setRecurringIncomes(sortRecurringIncomes(data.recurringIncomes));
  }

  async function handleSubmit(
    values: RecurringIncomeFormValues
  ): Promise<RecurringIncomeFormState> {
    setIsSubmitting(true);
    setPageError(null);
    setPageMessage(null);

    try {
      const response = await fetch("/api/recurring-incomes", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(values)
      });

      const data = await readResponse<{ recurringIncome: RecurringIncome }>(response);
      setRecurringIncomes((current) =>
        sortRecurringIncomes([data.recurringIncome, ...current])
      );
      setIsCreateModalOpen(false);

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
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    const previous = recurringIncomes;
    setLoadingId(id);
    setPageError(null);
    setPageMessage(null);
    setRecurringIncomes((current) =>
      sortRecurringIncomes(
        current.map((item) => (item.id === id ? { ...item, isActive } : item))
      )
    );

    try {
      const response = await fetch(`/api/recurring-incomes/${id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({ isActive })
      });

      const data = await readResponse<{ recurringIncome: RecurringIncome }>(response);
      setRecurringIncomes((current) =>
        sortRecurringIncomes(
          current.map((item) => (item.id === id ? data.recurringIncome : item))
        )
      );
    } catch (error) {
      setRecurringIncomes(previous);
      setPageError(
        error instanceof Error ? error.message : "Impossibile aggiornare la ricorrenza."
      );
    } finally {
      setLoadingId(null);
    }
  }

  async function handleMaterialize() {
    setIsMaterializing(true);
    setPageError(null);
    setPageMessage(null);

    try {
      const response = await fetch("/api/recurring-incomes/materialize", {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json" }
      });

      const data = await readResponse<{ result: MaterializeRecurringIncomesResult }>(response);
      await reloadRecurringIncomes();
      setPageMessage(
        `${data.result.createdTransactions} occorrenze create, ${data.result.skippedDuplicates} duplicati ignorati.`
      );
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Impossibile sincronizzare le ricorrenze."
      );
    } finally {
      setIsMaterializing(false);
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
      const response = await fetch(`/api/recurring-incomes/${target.id}`, {
        method: "DELETE",
        credentials: "same-origin",
        headers: { Accept: "application/json" }
      });

      await readResponse<{ recurringIncome: RecurringIncome }>(response);
      setRecurringIncomes((current) => current.filter((item) => item.id !== target.id));
      setPageMessage("Entrata ricorrente eliminata. Le transazioni gia generate restano invariate.");
      setRecurringIncomeToDelete(null);
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
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => void handleMaterialize()}
          >
            <RefreshCcw className="h-4 w-4" />
            {isMaterializing ? "Sincronizzo..." : "Sincronizza ora"}
          </Button>
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
        <RecurringIncomeForm isSubmitting={isSubmitting} onSubmit={handleSubmit} />
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
