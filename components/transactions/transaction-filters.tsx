"use client";

import { getCategoryIcon } from "@/lib/categories/catalog";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type {
  TransactionCategoryOption,
  TransactionFilters as TransactionFilterValues
} from "@/types/transactions";

type TransactionFiltersProps = {
  availableMonths: string[];
  categories: TransactionCategoryOption[];
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
  const visibleCategories = categories.filter((category) => {
    if (!filters.type || filters.type === "all") {
      return true;
    }

    return category.type === filters.type;
  });
  const selectedCategory = categories.find((category) => category.value === filters.category);
  const SelectedCategoryIcon = selectedCategory
    ? getCategoryIcon(selectedCategory.categorySlug, selectedCategory.type)
    : null;

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
          {visibleCategories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.type === "income" && (!filters.type || filters.type === "all")
                ? `Entrata · ${category.label}`
                : category.type === "expense" && (!filters.type || filters.type === "all")
                  ? `Spesa · ${category.label}`
                  : category.label}
            </option>
          ))}
        </Select>
        {selectedCategory && SelectedCategoryIcon ? (
          <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm">
            <SelectedCategoryIcon className="h-3.5 w-3.5" />
            <span>{selectedCategory.label}</span>
            {selectedCategory.isLegacy ? (
              <span className="text-slate-400">storica</span>
            ) : null}
          </div>
        ) : null}
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
          <option value="expense">Spese</option>
          <option value="income">Entrate</option>
        </Select>
      </div>
    </div>
  );
}
