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

import { invalidateDomainQueries } from "@/lib/query/invalidate-domain-cache";
import {
  createSyncSourceId,
  subscribeToSyncEvents
} from "@/lib/query/sync-events";

const DEFAULT_QUERY_STALE_TIME = 2 * 60_000;
const DEFAULT_QUERY_GC_TIME = 15 * 60_000;

function QuerySyncBridge({ sourceId }: { sourceId: string }) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    return subscribeToSyncEvents((event) => {
      if (event.sourceId === sourceId) {
        return;
      }

      void invalidateDomainQueries(queryClient, event.domain);

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
            staleTime: DEFAULT_QUERY_STALE_TIME,
            gcTime: DEFAULT_QUERY_GC_TIME,
            refetchOnMount: false,
            refetchOnReconnect: true,
            refetchOnWindowFocus: false
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
