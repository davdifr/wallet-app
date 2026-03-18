"use client";

import {
  QueryClient,
  QueryClientProvider,
  useQueryClient
} from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState
} from "react";

import { queryKeys } from "@/lib/query/query-keys";
import {
  createSyncSourceId,
  type SyncDomain,
  subscribeToSyncEvents
} from "@/lib/query/sync-events";

function invalidateDomain(queryClient: QueryClient, domain: SyncDomain) {
  switch (domain) {
    case "transactions":
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      return;
    case "recurring-incomes":
      void queryClient.invalidateQueries({ queryKey: queryKeys.recurringIncomes.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      return;
    case "saving-goals":
      void queryClient.invalidateQueries({ queryKey: queryKeys.savingGoals.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      return;
    case "groups":
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
      return;
  }
}

function QuerySyncBridge({ sourceId }: { sourceId: string }) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    return subscribeToSyncEvents((event) => {
      if (event.sourceId === sourceId) {
        return;
      }

      invalidateDomain(queryClient, event.domain);

      if (pathname === "/dashboard") {
        router.refresh();
      }
    });
  }, [pathname, queryClient, router, sourceId]);

  return null;
}

const SyncSourceContext = createContext<string | null>(null);

export function useSyncSourceId() {
  const sourceId = useContext(SyncSourceContext);

  if (!sourceId) {
    throw new Error("useSyncSourceId deve essere usato dentro DashboardQueryProvider.");
  }

  return sourceId;
}

export function DashboardQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            refetchOnReconnect: true,
            refetchOnWindowFocus: true
          }
        }
      })
  );
  const [sourceId] = useState(() => createSyncSourceId());

  return (
    <QueryClientProvider client={queryClient}>
      <SyncSourceContext.Provider value={sourceId}>
        <QuerySyncBridge sourceId={sourceId} />
        {children}
      </SyncSourceContext.Provider>
    </QueryClientProvider>
  );
}
