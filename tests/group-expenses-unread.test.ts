import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn()
}));

import {
  calculateHasUnreadSharedExpenses,
  getLatestRelevantSharedExpenseAt
} from "@/lib/group-expenses/unread-expenses";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createSharedExpense,
  getGroupsUnreadSummary,
  listGroupsWithDetails,
  markGroupSharedExpensesViewed
} from "@/services/group-expenses/group-expenses-service";

describe("group unread expense helpers", () => {
  it("restituisce false per un gruppo senza spese", () => {
    expect(
      calculateHasUnreadSharedExpenses({
        expenses: [],
        currentUserId: "user-1",
        lastViewedAt: null,
        joinedAt: "2026-03-01T10:00:00.000Z"
      })
    ).toBe(false);
  });

  it("alla prima visualizzazione usa joinedAt come baseline", () => {
    expect(
      calculateHasUnreadSharedExpenses({
        expenses: [
          {
            createdAt: "2026-03-03T10:00:00.000Z",
            createdByUserId: "user-2"
          }
        ],
        currentUserId: "user-1",
        lastViewedAt: null,
        joinedAt: "2026-03-05T10:00:00.000Z"
      })
    ).toBe(false);
  });

  it("ignora le spese create dall'utente corrente per il calcolo unread", () => {
    expect(
      getLatestRelevantSharedExpenseAt(
        [
          {
            createdAt: "2026-03-10T10:00:00.000Z",
            createdByUserId: "user-1"
          },
          {
            createdAt: "2026-03-09T10:00:00.000Z",
            createdByUserId: "user-2"
          }
        ],
        "user-1"
      )
    ).toBe("2026-03-09T10:00:00.000Z");
  });
});

describe("group expenses service unread state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("restituisce una lista gruppi con mix di gruppi letti e non letti", async () => {
    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "groups") {
          return {
            select: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "group-1",
                    name: "Casa",
                    description: null,
                    currency: "EUR",
                    owner_user_id: "user-1",
                    created_at: "2026-03-01T00:00:00.000Z",
                    updated_at: "2026-03-01T00:00:00.000Z"
                  },
                  {
                    id: "group-2",
                    name: "Vacanza",
                    description: null,
                    currency: "EUR",
                    owner_user_id: "user-1",
                    created_at: "2026-03-02T00:00:00.000Z",
                    updated_at: "2026-03-02T00:00:00.000Z"
                  }
                ],
                error: null
              })
            }))
          };
        }

        if (table === "group_members") {
          return {
            select: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "m-1",
                    group_id: "group-1",
                    user_id: "user-1",
                    display_name: "Owner",
                    guest_email: null,
                    is_guest: false,
                    role: "owner",
                    joined_at: "2026-03-01T10:00:00.000Z",
                    created_at: "2026-03-01T10:00:00.000Z",
                    updated_at: "2026-03-01T10:00:00.000Z"
                  },
                  {
                    id: "m-2",
                    group_id: "group-2",
                    user_id: "user-1",
                    display_name: "Owner",
                    guest_email: null,
                    is_guest: false,
                    role: "owner",
                    joined_at: "2026-03-02T10:00:00.000Z",
                    created_at: "2026-03-02T10:00:00.000Z",
                    updated_at: "2026-03-02T10:00:00.000Z"
                  }
                ],
                error: null
              })
            }))
          };
        }

        if (table === "shared_expenses") {
          return {
            select: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "expense-1",
                    group_id: "group-1",
                    created_by_user_id: "user-2",
                    paid_by_user_id: "user-2",
                    paid_by_member_id: "m-1",
                    title: "Spesa nuova",
                    description: null,
                    amount: 50,
                    currency: "EUR",
                    expense_date: "2026-03-10",
                    split_method: "equal",
                    status: "posted",
                    transaction_id: null,
                    created_at: "2026-03-12T10:00:00.000Z",
                    updated_at: "2026-03-12T10:00:00.000Z"
                  },
                  {
                    id: "expense-2",
                    group_id: "group-2",
                    created_by_user_id: "user-2",
                    paid_by_user_id: "user-2",
                    paid_by_member_id: "m-2",
                    title: "Spesa vecchia",
                    description: null,
                    amount: 80,
                    currency: "EUR",
                    expense_date: "2026-03-08",
                    split_method: "equal",
                    status: "posted",
                    transaction_id: null,
                    created_at: "2026-03-08T10:00:00.000Z",
                    updated_at: "2026-03-08T10:00:00.000Z"
                  }
                ],
                error: null
              })
            }))
          };
        }

        if (table === "shared_expense_splits") {
          return {
            select: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({ data: [], error: null })
            }))
          };
        }

        if (table === "group_member_views") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "view-1",
                    group_id: "group-1",
                    user_id: "user-1",
                    last_viewed_shared_expenses_at: "2026-03-11T10:00:00.000Z",
                    created_at: "2026-03-11T10:00:00.000Z",
                    updated_at: "2026-03-11T10:00:00.000Z"
                  },
                  {
                    id: "view-2",
                    group_id: "group-2",
                    user_id: "user-1",
                    last_viewed_shared_expenses_at: "2026-03-09T10:00:00.000Z",
                    created_at: "2026-03-09T10:00:00.000Z",
                    updated_at: "2026-03-09T10:00:00.000Z"
                  }
                ],
                error: null
              })
            }))
          };
        }

        if (table === "settlements") {
          return {
            select: vi.fn(() => ({
              not: vi.fn(() => ({
                not: vi.fn(() => ({
                  order: vi.fn().mockResolvedValue({ data: [], error: null })
                }))
              }))
            }))
          };
        }

        throw new Error(`Unexpected table ${table}`);
      }),
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            id: "user-1",
            email: "owner@example.com",
            full_name: "Owner",
            avatar_url: null
          }
        ],
        error: null
      })
    };

    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockClient as never);

    const groups = await listGroupsWithDetails({ userId: "user-1" });

    expect(groups).toHaveLength(2);
    expect(groups.find((item) => item.group.id === "group-1")?.group.hasUnreadExpenses).toBe(
      true
    );
    expect(groups.find((item) => item.group.id === "group-2")?.group.hasUnreadExpenses).toBe(
      false
    );
  });

  it("espone unread summary true se almeno un gruppo ha nuove spese", async () => {
    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "groups") {
          return {
            select: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "group-1",
                    name: "Casa",
                    description: null,
                    currency: "EUR",
                    owner_user_id: "user-1",
                    created_at: "2026-03-01T00:00:00.000Z",
                    updated_at: "2026-03-01T00:00:00.000Z"
                  }
                ],
                error: null
              })
            }))
          };
        }

        if (table === "group_members") {
          return {
            select: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "m-1",
                    group_id: "group-1",
                    user_id: "user-1",
                    display_name: "Owner",
                    guest_email: null,
                    is_guest: false,
                    role: "owner",
                    joined_at: "2026-03-01T10:00:00.000Z",
                    created_at: "2026-03-01T10:00:00.000Z",
                    updated_at: "2026-03-01T10:00:00.000Z"
                  }
                ],
                error: null
              })
            }))
          };
        }

        if (table === "shared_expenses") {
          return {
            select: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "expense-1",
                    group_id: "group-1",
                    created_by_user_id: "user-2",
                    paid_by_user_id: "user-2",
                    paid_by_member_id: "m-1",
                    title: "Spesa nuova",
                    description: null,
                    amount: 50,
                    currency: "EUR",
                    expense_date: "2026-03-10",
                    split_method: "equal",
                    status: "posted",
                    transaction_id: null,
                    created_at: "2026-03-12T10:00:00.000Z",
                    updated_at: "2026-03-12T10:00:00.000Z"
                  }
                ],
                error: null
              })
            }))
          };
        }

        if (table === "shared_expense_splits") {
          return {
            select: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({ data: [], error: null })
            }))
          };
        }

        if (table === "group_member_views") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "view-1",
                    group_id: "group-1",
                    user_id: "user-1",
                    last_viewed_shared_expenses_at: "2026-03-11T10:00:00.000Z",
                    created_at: "2026-03-11T10:00:00.000Z",
                    updated_at: "2026-03-11T10:00:00.000Z"
                  }
                ],
                error: null
              })
            }))
          };
        }

        if (table === "settlements") {
          return {
            select: vi.fn(() => ({
              not: vi.fn(() => ({
                not: vi.fn(() => ({
                  order: vi.fn().mockResolvedValue({ data: [], error: null })
                }))
              }))
            }))
          };
        }

        throw new Error(`Unexpected table ${table}`);
      }),
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            id: "user-1",
            email: "owner@example.com",
            full_name: "Owner",
            avatar_url: null
          }
        ],
        error: null
      })
    };

    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockClient as never);

    const summary = await getGroupsUnreadSummary("user-1");

    expect(summary.hasUnreadGroups).toBe(true);
  });

  it("mark as seen e idempotente", async () => {
    const upsertSpy = vi.fn().mockResolvedValue({ error: null });

    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "group_members") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { id: "member-1" },
                    error: null
                  })
                }))
              }))
            }))
          };
        }

        if (table === "group_member_views") {
          return {
            upsert: upsertSpy
          };
        }

        throw new Error(`Unexpected table ${table}`);
      })
    };

    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockClient as never);

    await markGroupSharedExpensesViewed("user-1", "group-1");
    await markGroupSharedExpensesViewed("user-1", "group-1");

    expect(upsertSpy).toHaveBeenCalledTimes(2);
    expect(upsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        group_id: "group-1",
        user_id: "user-1"
      }),
      { onConflict: "group_id,user_id" }
    );
  });

  it("quando l'autore crea una spesa aggiorna il proprio view state e mantiene il gruppo visto", async () => {
    const insertExpenseSpy = vi.fn().mockResolvedValue({ error: null });
    const insertSplitsSpy = vi.fn().mockResolvedValue({ error: null });
    const upsertViewSpy = vi.fn().mockResolvedValue({ error: null });
    const insertTransactionsSpy = vi.fn().mockResolvedValue({ error: null });

    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "group_members") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "member-1",
                    group_id: "group-1",
                    user_id: "user-1",
                    display_name: "Owner",
                    guest_email: null,
                    is_guest: false,
                    role: "owner",
                    joined_at: "2026-03-01T10:00:00.000Z",
                    created_at: "2026-03-01T10:00:00.000Z",
                    updated_at: "2026-03-01T10:00:00.000Z"
                  },
                  {
                    id: "member-2",
                    group_id: "group-1",
                    user_id: "user-2",
                    display_name: "Marco",
                    guest_email: null,
                    is_guest: false,
                    role: "member",
                    joined_at: "2026-03-02T10:00:00.000Z",
                    created_at: "2026-03-02T10:00:00.000Z",
                    updated_at: "2026-03-02T10:00:00.000Z"
                  },
                  {
                    id: "guest-1",
                    group_id: "group-1",
                    user_id: null,
                    display_name: "Guest",
                    guest_email: "guest@example.com",
                    is_guest: true,
                    role: "member",
                    joined_at: "2026-03-03T10:00:00.000Z",
                    created_at: "2026-03-03T10:00:00.000Z",
                    updated_at: "2026-03-03T10:00:00.000Z"
                  }
                ],
                error: null
              })
            }))
          };
        }

        if (table === "shared_expenses") {
          return {
            insert: insertExpenseSpy
          };
        }

        if (table === "shared_expense_splits") {
          return {
            insert: insertSplitsSpy
          };
        }

        if (table === "group_member_views") {
          return {
            upsert: upsertViewSpy
          };
        }

        if (table === "transactions") {
          return {
            insert: insertTransactionsSpy
          };
        }

        throw new Error(`Unexpected table ${table}`);
      })
    };

    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockClient as never);

    await createSharedExpense("user-1", {
      groupId: "group-1",
      title: "Spesa cena",
      description: "",
      amount: "90",
      expenseDate: "2026-03-18",
      splitMethod: "equal",
      paidByMemberId: "member-1",
      splitValues: ""
    });

    expect(insertExpenseSpy).toHaveBeenCalledTimes(1);
    expect(insertSplitsSpy).toHaveBeenCalledTimes(1);
    expect(upsertViewSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        group_id: "group-1",
        user_id: "user-1"
      }),
      { onConflict: "group_id,user_id" }
    );
    expect(insertTransactionsSpy).toHaveBeenCalledTimes(1);
  });
});
