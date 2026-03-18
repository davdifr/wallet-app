import type { QueryClient, QueryKey } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query/query-keys";
import type { SyncDomain } from "@/lib/query/sync-events";

export function getInvalidationQueryKeys(domain: SyncDomain): QueryKey[] {
  switch (domain) {
    case "transactions":
      return [
        queryKeys.transactions.all,
        queryKeys.dashboard,
        queryKeys.piggyBank.all,
        queryKeys.savingGoals.all
      ];
    case "recurring-incomes":
      return [
        queryKeys.recurringIncomes.all,
        queryKeys.transactions.all,
        queryKeys.dashboard,
        queryKeys.piggyBank.all
      ];
    case "saving-goals":
      return [
        queryKeys.savingGoals.all,
        queryKeys.dashboard,
        queryKeys.piggyBank.all
      ];
    case "piggy-bank":
      return [
        queryKeys.piggyBank.all,
        queryKeys.dashboard,
        queryKeys.savingGoals.all
      ];
    case "groups":
      return [queryKeys.groups.all, queryKeys.groups.detailRoot];
  }
}

export async function invalidateDomainQueries(
  queryClient: Pick<QueryClient, "invalidateQueries">,
  domain: SyncDomain
) {
  const queryKeysToInvalidate = getInvalidationQueryKeys(domain);

  await Promise.all(
    queryKeysToInvalidate.map((queryKey) =>
      queryClient.invalidateQueries({ queryKey })
    )
  );
}
