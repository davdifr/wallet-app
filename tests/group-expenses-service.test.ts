import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn()
}));

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  addGroupMember,
  createGroup,
  deleteGroup,
  settleSharedExpenseSplit
} from "@/services/group-expenses/group-expenses-service";

describe("group expenses service smoke coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("crea un gruppo con owner e valuta EUR", async () => {
    const insertSpy = vi.fn().mockResolvedValue({ error: null });

    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "groups") {
          return {
            insert: insertSpy
          };
        }

        throw new Error(`Unexpected table ${table}`);
      })
    };

    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockClient as never);

    await createGroup("user-1", {
      name: "Weekend",
      description: "Spese casa"
    });

    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        owner_user_id: "user-1",
        name: "Weekend",
        description: "Spese casa",
        currency: "EUR"
      })
    );
  });

  it("aggiunge un membro guest senza toccare la directory utenti", async () => {
    const insertSpy = vi.fn().mockResolvedValue({ error: null });
    const rpcSpy = vi.fn();

    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "group_members") {
          return {
            insert: insertSpy
          };
        }

        throw new Error(`Unexpected table ${table}`);
      }),
      rpc: rpcSpy
    };

    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockClient as never);

    await addGroupMember({
      groupId: "group-1",
      email: "",
      displayName: "Luca",
      guestEmail: "luca@example.com",
      memberType: "guest"
    });

    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        group_id: "group-1",
        user_id: null,
        display_name: "Luca",
        guest_email: "luca@example.com",
        is_guest: true,
        role: "member"
      })
    );
    expect(rpcSpy).not.toHaveBeenCalled();
  });

  it("elimina un gruppo scollegando prima le transazioni condivise", async () => {
    const updateTransactionsSpy = vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({ error: null })
    }));
    const deleteGroupSpy = vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({ error: null })
    }));

    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "groups") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "group-1",
                    owner_user_id: "user-1",
                    name: "Casa",
                    description: null,
                    currency: "EUR",
                    created_at: "2026-03-01T00:00:00.000Z",
                    updated_at: "2026-03-01T00:00:00.000Z"
                  },
                  error: null
                })
              }))
            })),
            delete: deleteGroupSpy
          };
        }

        if (table === "transactions") {
          return {
            update: updateTransactionsSpy
          };
        }

        throw new Error(`Unexpected table ${table}`);
      })
    };

    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockClient as never);

    await deleteGroup("user-1", "group-1");

    expect(updateTransactionsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        group_id: null,
        is_shared: false,
        shared_expense_id: null,
        settlement_id: null
      })
    );
    expect(deleteGroupSpy).toHaveBeenCalled();
  });

  it("completa subito un settlement quando l'attore e una delle parti coinvolte", async () => {
    const insertSettlementSpy = vi.fn().mockResolvedValue({ error: null });
    const updateSplitSpy = vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({ error: null })
    }));
    const insertTransactionsSpy = vi.fn().mockResolvedValue({ error: null });

    let settlementSelectCalls = 0;

    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "shared_expense_splits") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "split-1",
                    amount: 40,
                    settled_amount: 0
                  },
                  error: null
                })
              }))
            })),
            update: updateSplitSpy
          };
        }

        if (table === "shared_expenses") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { id: "expense-1", title: "Cena" },
                  error: null
                })
              }))
            }))
          };
        }

        if (table === "group_members") {
          return {
            select: vi.fn(() => ({
              in: vi.fn().mockResolvedValue({
                data: [
                  { id: "member-1", user_id: "user-1", is_guest: false },
                  { id: "member-2", user_id: "user-2", is_guest: false }
                ],
                error: null
              })
            }))
          };
        }

        if (table === "settlements") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
              }))
            })),
            insert: insertSettlementSpy
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

    const result = await settleSharedExpenseSplit("user-1", {
      groupId: "group-1",
      expenseId: "expense-1",
      splitId: "split-1",
      payerMemberId: "member-1",
      payeeMemberId: "member-2",
      amount: "20",
      note: "Parziale"
    });

    expect(result.status).toBe("completed");
    expect(insertSettlementSpy).toHaveBeenCalled();
    expect(updateSplitSpy).toHaveBeenCalled();
    expect(insertTransactionsSpy).toHaveBeenCalled();
    expect(settlementSelectCalls).toBe(0);
  });
});
