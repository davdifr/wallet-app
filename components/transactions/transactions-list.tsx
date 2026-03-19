"use client";

import { Pencil, Trash2 } from "lucide-react";

import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategoryIcon } from "@/lib/categories/catalog";
import type {
  Transaction,
  TransactionCategoryOption,
  TransactionFilters as FilterValues
} from "@/types/transactions";

type TransactionsListProps = {
  availableMonths: string[];
  categories: TransactionCategoryOption[];
  deletingId?: string | null;
  filters: FilterValues;
  isLoading?: boolean;
  transactions: Transaction[];
  onApplyFilters: (filters: FilterValues) => void;
  onDelete: (transactionId: string) => void;
  onEdit: (transaction: Transaction) => void;
};

function formatAmount(amount: number, type: Transaction["type"]) {
  const value = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR"
  }).format(amount);

  return type === "income" ? `+ ${value}` : `- ${value}`;
}

export function TransactionsList({
  availableMonths,
  categories,
  deletingId = null,
  filters,
  isLoading = false,
  transactions,
  onApplyFilters,
  onDelete,
  onEdit
}: TransactionsListProps) {
  return (
    <Card className="border-white/70 bg-white/85 shadow-soft backdrop-blur">
      <CardHeader className="space-y-4">
        <div className="space-y-2">
          <CardTitle className="font-display text-2xl text-slate-950">
            Lista transazioni
          </CardTitle>
          <p className="text-sm text-slate-500">
            Lista reattiva con filtri locali e sincronizzazione in background.
          </p>
        </div>
        <TransactionFilters
          availableMonths={availableMonths}
          categories={categories}
          filters={filters}
          loading={isLoading}
          onApply={onApplyFilters}
        />
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-12 text-center">
            <h3 className="font-display text-xl font-semibold text-slate-950">
              Aggiornamento in corso
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Sto sincronizzando la lista con gli ultimi dati.
            </p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-12 text-center">
            <h3 className="font-display text-xl font-semibold text-slate-950">
              Nessuna transazione trovata
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Prova a cambiare i filtri oppure crea il primo movimento.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => {
              const CategoryIcon = getCategoryIcon(transaction.categorySlug, transaction.type);

              return (
                <div
                  key={transaction.id}
                  className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-2xl bg-white p-2 text-slate-700">
                        <CategoryIcon className="h-4 w-4" />
                      </span>
                      <p className="font-medium text-slate-950">{transaction.category}</p>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-500">
                        {transaction.type === "income" ? "Entrata" : "Spesa"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{transaction.source}</p>
                    {transaction.isLegacyCategoryFallback ? (
                      <p className="text-xs text-amber-700">
                        Categoria storica non standard: verra riclassificata al prossimo salvataggio.
                      </p>
                    ) : null}
                    <p className="text-xs text-slate-500">
                      {transaction.date}
                      {transaction.note ? ` · ${transaction.note}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:items-end">
                    <p
                      className={
                        transaction.type === "income"
                          ? "font-display text-xl font-semibold text-emerald-600"
                          : "font-display text-xl font-semibold text-rose-600"
                      }
                    >
                      {formatAmount(transaction.amount, transaction.type)}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => onEdit(transaction)}>
                        <Pencil className="h-4 w-4" />
                        Modifica
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        disabled={deletingId === transaction.id}
                        onClick={() => onDelete(transaction.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletingId === transaction.id ? "Elimino..." : "Elimina"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
