"use client";

import { PauseCircle, PlayCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="border-white/70 bg-white/85 shadow-soft backdrop-blur">
      <CardHeader>
        <CardTitle className="font-display text-2xl text-slate-950">
          Ricorrenze attive e archiviate
        </CardTitle>
        <p className="text-sm text-slate-500">
          Le occorrenze vengono trasformate in `transactions` di tipo income.
        </p>
      </CardHeader>

      <CardContent>
        {recurringIncomes.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-12 text-center">
            <h3 className="font-display text-xl font-semibold text-slate-950">
              Nessuna recurring income configurata
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Crea la prima ricorrenza per iniziare a generare entrate automatiche.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recurringIncomes.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-950">{item.category}</p>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-500">
                      {item.frequency}
                    </span>
                    <span
                      className={
                        item.isActive
                          ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700"
                          : "rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600"
                      }
                    >
                      {item.isActive ? "attiva" : "disattivata"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{item.description}</p>
                  <p className="text-xs text-slate-500">
                    {item.source} · prossimo evento {item.nextOccurrenceOn}
                    {item.endsOn ? ` · fine ${item.endsOn}` : ""}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:items-end">
                  <p className="font-display text-2xl font-semibold text-emerald-600">
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
                      className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      disabled={loadingId === item.id || deletingId === item.id}
                      onClick={() => onDelete(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingId === item.id ? "Elimino..." : "Elimina"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
