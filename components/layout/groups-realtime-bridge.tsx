"use client";

import { useGroupExpensesRealtimeSync } from "@/components/groups/use-group-expenses-realtime-sync";

export function GroupsRealtimeBridge() {
  useGroupExpensesRealtimeSync();

  return null;
}
