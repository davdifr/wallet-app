"use client";

import { getCategoryIcon } from "@/lib/categories/catalog";
import { Button } from "@/components/ui/button";
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
  const typeOptions = [
    { label: "Tutti", value: "all" },
    { label: "Spese", value: "expense" },
    { label: "Entrate", value: "income" }
  ] as const;

  return (
    <div className="space-y-4 rounded-[1.2rem] bg-secondary p-4">
      <div className="space-y-2">
        <Label>Mostra</Label>
        <div className="grid grid-cols-3 gap-2 rounded-[1rem] bg-background p-1">
          {typeOptions.map((option) => {
            const active = (filters.type ?? "all") === option.value;

            return (
              <Button
                key={option.value}
                type="button"
                variant={active ? "default" : "ghost"}
                className="min-h-10 rounded-[0.85rem] px-3 py-2 text-sm"
                disabled={loading}
                onClick={() =>
                  onApply({
                    ...filters,
                    type: option.value
                  })
                }
              >
                {option.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
        </div>
      </div>

      {selectedCategory && SelectedCategoryIcon ? (
        <div className="flex min-h-8 items-center gap-2 rounded-full bg-background px-3 py-2 text-xs font-medium text-foreground">
          <SelectedCategoryIcon className="h-3.5 w-3.5" />
          <span>{selectedCategory.label}</span>
          {selectedCategory.isLegacy ? (
            <span className="text-muted-foreground">storica</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
