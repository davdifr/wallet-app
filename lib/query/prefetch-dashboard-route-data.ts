import type { QueryClient } from "@tanstack/react-query";

import { fetchJson } from "@/lib/query/fetch-json";
import { queryKeys } from "@/lib/query/query-keys";
import type { DashboardApiData } from "@/services/dashboard/dashboard-service";
import type { GroupDetails } from "@/types/group-expenses";
import type { RecurringIncome } from "@/types/recurring-incomes";
import type { SavingGoal } from "@/types/saving-goals";
import type { Transaction, TransactionFilters } from "@/types/transactions";

type TransactionsApiResponse = {
  availableMonths: string[];
  categories: string[];
  transactions: Transaction[];
};

type GroupsApiResponse = {
  currentUserId: string | null;
  groups: GroupDetails[];
  inviteCandidates: Array<{
    email: string;
    fullName: string | null;
    id: string;
  }>;
};

const defaultTransactionFilters: TransactionFilters = {
  category: undefined,
  month: undefined,
  type: undefined
};

export async function prefetchDashboardRouteData(queryClient: QueryClient, href: string) {
  switch (href) {
    case "/dashboard":
      await queryClient.prefetchQuery({
        queryKey: queryKeys.dashboard,
        queryFn: () =>
          fetchJson<DashboardApiData>("/api/dashboard", {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store"
          })
      });
      return;
    case "/transactions":
      await queryClient.prefetchQuery({
        queryKey: queryKeys.transactions.list(defaultTransactionFilters),
        queryFn: () =>
          fetchJson<TransactionsApiResponse>("/api/transactions", {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store"
          })
      });
      return;
    case "/recurring-incomes":
      await queryClient.prefetchQuery({
        queryKey: queryKeys.recurringIncomes.all,
        queryFn: () =>
          fetchJson<{ recurringIncomes: RecurringIncome[] }>("/api/recurring-incomes", {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store"
          })
      });
      return;
    case "/saving-goals":
      await queryClient.prefetchQuery({
        queryKey: queryKeys.savingGoals.all,
        queryFn: () =>
          fetchJson<{ goals: SavingGoal[] }>("/api/saving-goals", {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store"
          })
      });
      return;
    case "/groups":
      await queryClient.prefetchQuery({
        queryKey: queryKeys.groups.all,
        queryFn: () =>
          fetchJson<GroupsApiResponse>("/api/groups", {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store"
          })
      });
      return;
    default:
      return;
  }
}
