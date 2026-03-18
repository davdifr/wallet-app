"use client";

import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query/query-keys";

type UseGroupExpensesRealtimeSyncOptions = {
  groupId?: string;
  currentUserId?: string;
};

export function useGroupExpensesRealtimeSync(
  options: UseGroupExpensesRealtimeSyncOptions = {}
) {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const groupId = options.groupId ?? null;
  const currentUserId = options.currentUserId ?? null;

  useEffect(() => {
    const channelName = groupId
      ? `groups-shared-expenses-${groupId}`
      : "groups-shared-expenses";

    const handleSharedExpenseChange = (
      payload: RealtimePostgresChangesPayload<{
        created_by_user_id: string | null;
        group_id: string;
      }>
    ) => {
      const nextRow =
        payload.eventType === "DELETE"
          ? null
          : (payload.new as { created_by_user_id?: string | null; group_id?: string } | null);
      const changedGroupId = nextRow?.group_id ?? groupId;
      const createdByUserId = nextRow?.created_by_user_id ?? null;

      if (
        !groupId &&
        payload.eventType === "INSERT" &&
        changedGroupId &&
        createdByUserId !== null &&
        createdByUserId !== currentUserId
      ) {
        queryClient.setQueryData<{ hasUnreadGroups: boolean }>(
          queryKeys.groups.unreadSummary,
          { hasUnreadGroups: true }
        );
      }

      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });

      if (groupId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.groups.detail(groupId)
        });
      }
    };

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
        handleSharedExpenseChange
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(subscription);
    };
  }, [currentUserId, groupId, queryClient, supabase]);
}
