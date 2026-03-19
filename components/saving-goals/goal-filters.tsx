"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export type GoalViewFilter = "all" | "active" | "completed";

type GoalFiltersProps = {
  activeFilter: GoalViewFilter;
  onChange: (filter: GoalViewFilter) => void;
};

const filterOptions = [
  { label: "Da finanziare", value: "active" },
  { label: "Completati", value: "completed" },
  { label: "Tutti", value: "all" }
] as const satisfies ReadonlyArray<{
  label: string;
  value: GoalViewFilter;
}>;

export function GoalFilters({ activeFilter, onChange }: GoalFiltersProps) {
  return (
    <div className="rounded-[1.2rem] bg-secondary p-4">
      <div className="space-y-2">
        <Label>Mostra</Label>
        <div className="grid grid-cols-3 gap-2 rounded-[1rem] bg-background p-1">
          {filterOptions.map((option) => {
            const isActive = activeFilter === option.value;

            return (
              <Button
                key={option.value}
                type="button"
                variant={isActive ? "default" : "ghost"}
                className="min-h-10 rounded-[0.85rem] px-3 py-2 text-sm"
                onClick={() => onChange(option.value)}
              >
                {option.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
