import type { TransactionFilters } from "@/types/transactions";

export const queryKeys = {
  dashboard: ["dashboard"] as const,
  transactions: {
    all: ["transactions"] as const,
    list: (filters: TransactionFilters) => ["transactions", filters] as const
  },
  recurringIncomes: {
    all: ["recurring-incomes"] as const
  },
  savingGoals: {
    all: ["saving-goals"] as const
  },
  groups: {
    all: ["groups"] as const,
    detail: (groupId: string) => ["groups", "detail", groupId] as const
  }
};
