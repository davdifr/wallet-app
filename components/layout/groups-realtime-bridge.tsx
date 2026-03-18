"use client";

import { useGroupExpensesRealtimeSync } from "@/components/groups/use-group-expenses-realtime-sync";

type GroupsRealtimeBridgeProps = {
  currentUserId: string;
};

export function GroupsRealtimeBridge({ currentUserId }: GroupsRealtimeBridgeProps) {
  useGroupExpensesRealtimeSync({ currentUserId });

  return null;
}
