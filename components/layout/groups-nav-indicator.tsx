"use client";

import { useGroupsUnreadSummary } from "@/components/layout/use-groups-unread-summary";

type GroupsNavIndicatorProps = {
  mobile?: boolean;
};

export function GroupsNavIndicator({ mobile = false }: GroupsNavIndicatorProps) {
  const unreadSummaryQuery = useGroupsUnreadSummary();
  const hasUnreadGroups = unreadSummaryQuery.data?.hasUnreadGroups ?? false;

  if (!hasUnreadGroups) {
    return null;
  }

  if (mobile) {
    return (
      <span className="absolute right-2 top-1.5 inline-flex items-center">
        <span className="sr-only">Nuove spese nei gruppi</span>
        <span
          aria-hidden="true"
          className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_0_3px_rgba(255,255,255,0.95)]"
        />
      </span>
    );
  }

  return (
    <span className="ml-auto inline-flex items-center">
      <span className="sr-only">Nuove spese nei gruppi</span>
      <span
        aria-hidden="true"
        className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_0_4px_rgba(248,250,252,1)]"
      />
    </span>
  );
}
