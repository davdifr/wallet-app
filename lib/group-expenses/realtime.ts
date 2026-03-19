export type SharedExpenseRealtimeEvent = {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  createdByUserId?: string | null;
  currentUserId?: string | null;
};

export function shouldEnableUnreadGroupsFromSharedExpenseEvent(
  event: SharedExpenseRealtimeEvent
) {
  return (
    event.eventType === "INSERT" &&
    typeof event.createdByUserId === "string" &&
    event.createdByUserId.length > 0 &&
    event.createdByUserId !== event.currentUserId
  );
}
