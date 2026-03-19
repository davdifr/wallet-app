"use client";

import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

import { shouldEnableUnreadGroupsFromSharedExpenseEvent } from "@/lib/group-expenses/realtime";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query/query-keys";

type UseGroupExpensesRealtimeSyncOptions = {
  currentUserId?: string;
};

export function useGroupExpensesRealtimeSync(
  options: UseGroupExpensesRealtimeSyncOptions = {}
) {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const currentUserId = options.currentUserId ?? null;

  useEffect(() => {
    const channelName = `groups-realtime-${currentUserId ?? "anonymous"}`;

    const refreshGroupsQueries = () => {
      void queryClient.refetchQueries({
        queryKey: queryKeys.groups.unreadSummary,
        type: "active"
      });
      void queryClient.refetchQueries({
        queryKey: queryKeys.groups.all,
        type: "active"
      });
      void queryClient.refetchQueries({
        queryKey: queryKeys.groups.detailRoot,
        type: "active"
      });
    };

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
      const changedGroupId = nextRow?.group_id ?? null;
      const createdByUserId = nextRow?.created_by_user_id ?? null;

      if (
        changedGroupId &&
        shouldEnableUnreadGroupsFromSharedExpenseEvent({
          eventType: payload.eventType,
          createdByUserId,
          currentUserId
        })
      ) {
        queryClient.setQueryData<{ hasUnreadGroups: boolean }>(
          queryKeys.groups.unreadSummary,
          { hasUnreadGroups: true }
        );
      }

      refreshGroupsQueries();
    };

    const handleSettlementChange = () => {
      refreshGroupsQueries();
    };

    const subscription = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shared_expenses"
        },
        handleSharedExpenseChange
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "settlements"
        },
        handleSettlementChange
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(subscription);
    };
  }, [currentUserId, queryClient, supabase]);
}
