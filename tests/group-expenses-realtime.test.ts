import { describe, expect, it } from "vitest";

import { shouldEnableUnreadGroupsFromSharedExpenseEvent } from "@/lib/group-expenses/realtime";

describe("group expenses realtime helpers", () => {
  it("accende il badge unread solo per insert creati da altri utenti", () => {
    expect(
      shouldEnableUnreadGroupsFromSharedExpenseEvent({
        eventType: "INSERT",
        createdByUserId: "user-2",
        currentUserId: "user-1"
      })
    ).toBe(true);
  });

  it("non accende il badge per spese create dall'utente corrente", () => {
    expect(
      shouldEnableUnreadGroupsFromSharedExpenseEvent({
        eventType: "INSERT",
        createdByUserId: "user-1",
        currentUserId: "user-1"
      })
    ).toBe(false);
  });

  it("ignora update e delete per il badge unread", () => {
    expect(
      shouldEnableUnreadGroupsFromSharedExpenseEvent({
        eventType: "UPDATE",
        createdByUserId: "user-2",
        currentUserId: "user-1"
      })
    ).toBe(false);

    expect(
      shouldEnableUnreadGroupsFromSharedExpenseEvent({
        eventType: "DELETE",
        createdByUserId: "user-2",
        currentUserId: "user-1"
      })
    ).toBe(false);
  });
});
