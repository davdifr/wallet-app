import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn()
}));

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deletePiggyBankSettings } from "@/services/piggy-bank/piggy-bank-service";

describe("piggy bank service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rimuove il piano mensile senza perdere lo storico del ledger", async () => {
    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    const settingsGt = vi.fn().mockResolvedValue({ data: [], error: null });
    const settingsEq = vi.fn(() => ({ gt: settingsGt }));
    const settingsMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const movementsOrderCreatedAt = vi.fn().mockResolvedValue({
      data: [
        {
          id: "movement-1",
          user_id: "user-1",
          movement_type: "manual_add",
          amount: 120,
          movement_date: "2026-03-20",
          note: "Accantonamento iniziale",
          auto_instance_key: null,
          created_at: "2026-03-20T10:00:00.000Z",
          updated_at: "2026-03-20T10:00:00.000Z"
        }
      ],
      error: null
    });
    const movementsOrder = vi.fn(() => ({ order: movementsOrderCreatedAt }));

    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "piggy_bank_settings") {
          return {
            delete: vi.fn(() => ({ eq: deleteEq })),
            select: vi.fn(() => ({
              eq: settingsEq,
              maybeSingle: settingsMaybeSingle
            }))
          };
        }

        if (table === "piggy_bank_movements") {
          return {
            select: vi.fn(() => ({ order: movementsOrder }))
          };
        }

        throw new Error(`Unexpected table ${table}`);
      })
    };

    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockClient as never);

    const result = await deletePiggyBankSettings("user-1");

    expect(deleteEq).toHaveBeenCalledWith("user_id", "user-1");
    expect(result).toEqual({
      balance: 120,
      settings: null,
      recentMovements: [
        {
          id: "movement-1",
          movementType: "manual_add",
          amount: 120,
          movementDate: "2026-03-20",
          note: "Accantonamento iniziale",
          createdAt: "2026-03-20T10:00:00.000Z"
        }
      ]
    });
  });
});