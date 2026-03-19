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
    <Card>
      <CardHeader className="space-y-4">
        <div className="space-y-2">
          <CardTitle className="font-display text-[1.75rem] tracking-tight text-foreground">
            Movimenti
          </CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            Scorri, filtra e ritrova in fretta le operazioni che contano davvero.
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
          <div className="rounded-[1.2rem] bg-secondary px-6 py-12 text-center">
            <h3 className="font-display text-xl font-semibold text-foreground">
              Aggiornamento in corso
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Sto sincronizzando la lista con gli ultimi dati.
            </p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-[1.2rem] bg-secondary px-6 py-12 text-center">
            <h3 className="font-display text-xl font-semibold text-foreground">
              Nessuna transazione trovata
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Prova a cambiare i filtri oppure crea il primo movimento.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => {
              const CategoryIcon = getCategoryIcon(transaction.categorySlug, transaction.type);
              const primaryLabel = transaction.source || transaction.category;
              const secondaryLine = [transaction.category, transaction.date].filter(Boolean).join(" · ");

              return (
                <div
                  key={transaction.id}
                  className="rounded-[1.2rem] bg-secondary p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-background text-foreground">
                        <CategoryIcon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-semibold text-foreground">
                            {primaryLabel}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">{secondaryLine}</p>
                        </div>
                        <p
                          className={`shrink-0 text-[1.05rem] font-semibold tracking-tight ${
                            transaction.type === "income" ? "text-[#7DF4C2]" : "text-[#FF92B1]"
                          }`}
                        >
                          {formatAmount(transaction.amount, transaction.type)}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          {transaction.note ? (
                            <p className="truncate text-sm text-muted-foreground">{transaction.note}</p>
                          ) : transaction.isLegacyCategoryFallback ? (
                            <p className="text-xs text-muted-foreground">
                              Categoria storica non standard.
                            </p>
                          ) : (
                            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                              {transaction.type === "income" ? "Entrata" : "Spesa"}
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-10 min-h-10 w-10 rounded-[0.9rem] px-0"
                            onClick={() => onEdit(transaction)}
                            aria-label={`Modifica ${primaryLabel}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-10 min-h-10 w-10 rounded-[0.9rem] px-0 text-muted-foreground hover:text-foreground"
                            disabled={deletingId === transaction.id}
                            onClick={() => onDelete(transaction.id)}
                            aria-label={
                              deletingId === transaction.id
                                ? `Eliminazione in corso per ${primaryLabel}`
                                : `Elimina ${primaryLabel}`
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
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
