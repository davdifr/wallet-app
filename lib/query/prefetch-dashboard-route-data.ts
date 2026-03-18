import type { QueryClient } from "@tanstack/react-query";

import { fetchJson } from "@/lib/query/fetch-json";
import { queryKeys } from "@/lib/query/query-keys";
import type { DashboardApiData } from "@/types/dashboard";
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

const PREFETCH_STALE_TIME = 2 * 60_000;

function debugPrefetch(message: string) {
  if (typeof window === "undefined") {
    return;
  }

  if (window.localStorage.getItem("wallet-debug-prefetch") !== "1") {
    return;
  }

  console.info(`[prefetch] ${message}`);
}

export async function prefetchDashboardRouteData(queryClient: QueryClient, href: string) {
  switch (href) {
    case "/dashboard":
      await queryClient.prefetchQuery({
        queryKey: queryKeys.dashboard,
        staleTime: PREFETCH_STALE_TIME,
        queryFn: () =>
          fetchJson<DashboardApiData>("/api/dashboard", {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store"
          })
      });
      debugPrefetch("dashboard data prefetched");
      return;
    case "/transactions":
      await queryClient.prefetchQuery({
        queryKey: queryKeys.transactions.list(defaultTransactionFilters),
        staleTime: PREFETCH_STALE_TIME,
        queryFn: () =>
          fetchJson<TransactionsApiResponse>("/api/transactions", {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store"
          })
      });
      debugPrefetch("transactions data prefetched");
      return;
    case "/recurring-incomes":
      await queryClient.prefetchQuery({
        queryKey: queryKeys.recurringIncomes.all,
        staleTime: PREFETCH_STALE_TIME,
        queryFn: () =>
          fetchJson<{ recurringIncomes: RecurringIncome[] }>("/api/recurring-incomes", {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store"
          })
      });
      debugPrefetch("recurring incomes data prefetched");
      return;
    case "/saving-goals":
      await queryClient.prefetchQuery({
        queryKey: queryKeys.savingGoals.all,
        staleTime: PREFETCH_STALE_TIME,
        queryFn: () =>
          fetchJson<{ goals: SavingGoal[] }>("/api/saving-goals", {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store"
          })
      });
      debugPrefetch("saving goals data prefetched");
      return;
    case "/groups":
      await queryClient.prefetchQuery({
        queryKey: queryKeys.groups.all,
        staleTime: PREFETCH_STALE_TIME,
        queryFn: () =>
          fetchJson<GroupsApiResponse>("/api/groups", {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store"
          })
      });
      debugPrefetch("groups data prefetched");
      return;
    default:
      return;
  }
}
