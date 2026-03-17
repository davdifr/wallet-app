"use client";

import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { TransactionFilters as TransactionFilterValues } from "@/types/transactions";

type TransactionFiltersProps = {
  availableMonths: string[];
  categories: string[];
  filters: TransactionFilterValues;
  loading?: boolean;
  onApply: (filters: TransactionFilterValues) => void;
};

function formatMonthLabel(value: string) {
  const [year, month] = value.split("-").map(Number);

  if (!year || !month) {
    return value;
  }

  return new Intl.DateTimeFormat("it-IT", {
    month: "long",
    year: "numeric"
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function TransactionFilters({
  availableMonths,
  categories,
  filters,
  loading = false,
  onApply
}: TransactionFiltersProps) {
  return (
    <div className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-4 sm:grid-cols-2 xl:grid-cols-3">
      <div className="space-y-2">
        <Label htmlFor="month">Mese</Label>
        <Select
          id="month"
          name="month"
          value={filters.month ?? ""}
          disabled={loading}
          onChange={(event) =>
            onApply({
              ...filters,
              month: event.target.value || undefined
            })
          }
        >
          <option value="">Tutti i mesi</option>
          {availableMonths.map((month) => (
            <option key={month} value={month}>
              {formatMonthLabel(month)}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category-filter">Categoria</Label>
        <Select
          id="category-filter"
          name="category"
          value={filters.category ?? ""}
          disabled={loading}
          onChange={(event) =>
            onApply({
              ...filters,
              category: event.target.value || undefined
            })
          }
        >
          <option value="">Tutte</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="type-filter">Tipo</Label>
        <Select
          id="type-filter"
          name="type"
          value={filters.type ?? "all"}
          disabled={loading}
          onChange={(event) =>
            onApply({
              ...filters,
              type: event.target.value === "all" ? "all" : event.target.value as "expense" | "income"
            })
          }
        >
          <option value="all">Tutti</option>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </Select>
      </div>
    </div>
  );
}
