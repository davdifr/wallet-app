"use client";

import { useGroupsUnreadContext } from "@/components/layout/groups-unread-provider";

type GroupsNavIndicatorProps = {
  mobile?: boolean;
};

export function GroupsNavIndicator({ mobile = false }: GroupsNavIndicatorProps) {
  const { hasUnreadGroups } = useGroupsUnreadContext();

  if (!hasUnreadGroups) {
    return null;
  }

  if (mobile) {
    return (
      <span className="absolute right-2 top-1.5 inline-flex items-center">
        <span className="sr-only">Nuove spese nei gruppi</span>
        <span
          aria-hidden="true"
          className="h-2 w-2 rounded-full bg-foreground"
        />
      </span>
    );
  }

  return (
    <span className="ml-auto inline-flex items-center">
      <span className="sr-only">Nuove spese nei gruppi</span>
      <span
        aria-hidden="true"
        className="h-2.5 w-2.5 rounded-full bg-foreground"
      />
    </span>
  );
}
