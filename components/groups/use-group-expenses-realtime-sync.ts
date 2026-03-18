"use client";

import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query/query-keys";

type UseGroupExpensesRealtimeSyncOptions = {
  groupId?: string;
};

export function useGroupExpensesRealtimeSync(
  options: UseGroupExpensesRealtimeSyncOptions = {}
) {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const groupId = options.groupId ?? null;

  useEffect(() => {
    const channelName = groupId
      ? `groups-shared-expenses-${groupId}`
      : "groups-shared-expenses";

    const subscription = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shared_expenses",
          ...(groupId ? { filter: `group_id=eq.${groupId}` } : {})
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });

          if (groupId) {
            void queryClient.invalidateQueries({
              queryKey: queryKeys.groups.detail(groupId)
            });
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(subscription);
    };
  }, [groupId, queryClient, supabase]);
}
