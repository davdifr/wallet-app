"use client";

import { PauseCircle, PlayCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategoryIcon } from "@/lib/categories/catalog";
import type { RecurringIncome } from "@/types/recurring-incomes";

type RecurringIncomesListProps = {
  recurringIncomes: RecurringIncome[];
  loadingId?: string | null;
  deletingId?: string | null;
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (recurringIncome: RecurringIncome) => void;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}

export function RecurringIncomesList({
  recurringIncomes,
  loadingId = null,
  deletingId = null,
  onToggle,
  onDelete
}: RecurringIncomesListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-[1.75rem] tracking-tight text-foreground">
          Ricorrenze attive e archiviate
        </CardTitle>
      </CardHeader>

      <CardContent>
        {recurringIncomes.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-white/8 px-6 py-12 text-center">
            <h3 className="font-display text-xl font-semibold text-foreground">
              Nessuna ricorrenza configurata
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Crea la prima ricorrenza di entrata o spesa per generare movimenti automatici.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recurringIncomes.map((item) => {
              const CategoryIcon = getCategoryIcon(item.categorySlug, item.type);

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 rounded-[1.5rem] bg-secondary p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-background text-foreground">
                        <CategoryIcon className="h-4 w-4" />
                      </span>
                      <p className="font-medium text-foreground">{item.category}</p>
                      <span className="rounded-full bg-background px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        {item.frequency === "weekly"
                          ? "settimanale"
                          : item.frequency === "yearly"
                            ? "annuale"
                            : "mensile"}
                      </span>
                      <span
                        className={
                          item.isActive
                            ? "rounded-full bg-background px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[#7DF4C2]"
                            : "rounded-full bg-background px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
                        }
                      >
                        {item.isActive ? "attiva" : "disattivata"}
                      </span>
                      <span
                        className={
                          item.type === "income"
                            ? "rounded-full bg-background px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[#7DF4C2]"
                            : "rounded-full bg-background px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[#FF92B1]"
                        }
                      >
                        {item.type === "income" ? "entrata" : "spesa"}
                      </span>
                    </div>
                    {item.isLegacyCategoryFallback ? (
                      <p className="text-xs text-muted-foreground">
                        Categoria storica non standard: le nuove occorrenze useranno il fallback del catalogo.
                      </p>
                    ) : null}
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.source} · prossimo evento {item.nextOccurrenceOn}
                      {item.endsOn ? ` · fine ${item.endsOn}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:items-end">
                    <p
                      className={
                        item.type === "income"
                          ? "font-display text-2xl font-semibold tracking-tight text-[#7DF4C2]"
                          : "font-display text-2xl font-semibold tracking-tight text-[#FF92B1]"
                      }
                    >
                      {formatCurrency(item.amount)}
                    </p>

                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={loadingId === item.id || deletingId === item.id}
                        onClick={() => onToggle(item.id, !item.isActive)}
                      >
                        {item.isActive ? (
                          <PauseCircle className="h-4 w-4" />
                        ) : (
                          <PlayCircle className="h-4 w-4" />
                        )}
                        {loadingId === item.id
                          ? "Aggiorno..."
                          : item.isActive
                            ? "Disattiva"
                            : "Riattiva"}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-input text-foreground"
                        disabled={loadingId === item.id || deletingId === item.id}
                        onClick={() => onDelete(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletingId === item.id ? "Elimino..." : "Elimina"}
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
