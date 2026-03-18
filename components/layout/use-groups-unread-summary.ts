"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchJson } from "@/lib/query/fetch-json";
import { queryKeys } from "@/lib/query/query-keys";

type GroupsUnreadSummaryResponse = {
  hasUnreadGroups: boolean;
};

export function useGroupsUnreadSummary() {
  return useQuery({
    queryKey: queryKeys.groups.unreadSummary,
    queryFn: () =>
      fetchJson<GroupsUnreadSummaryResponse>("/api/groups/unread-summary", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store"
      }),
    staleTime: 15_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false
  });
}
