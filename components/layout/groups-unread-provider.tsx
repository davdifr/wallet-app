"use client";

import {
  createContext,
  type ReactNode,
  useContext
} from "react";

import { useGroupExpensesRealtimeSync } from "@/components/groups/use-group-expenses-realtime-sync";
import { useGroupsUnreadSummary } from "@/components/layout/use-groups-unread-summary";

type GroupsUnreadContextValue = {
  hasUnreadGroups: boolean;
};

const GroupsUnreadContext = createContext<GroupsUnreadContextValue>({
  hasUnreadGroups: false
});

type GroupsUnreadProviderProps = {
  children: ReactNode;
  currentUserId: string;
};

export function GroupsUnreadProvider({
  children,
  currentUserId
}: GroupsUnreadProviderProps) {
  const unreadSummaryQuery = useGroupsUnreadSummary();

  useGroupExpensesRealtimeSync({ currentUserId });

  return (
    <GroupsUnreadContext.Provider
      value={{
        hasUnreadGroups: unreadSummaryQuery.data?.hasUnreadGroups ?? false
      }}
    >
      {children}
    </GroupsUnreadContext.Provider>
  );
}

export function useGroupsUnreadContext() {
  return useContext(GroupsUnreadContext);
}
