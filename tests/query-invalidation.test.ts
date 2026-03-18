import { describe, expect, it, vi } from "vitest";

import {
  getInvalidationQueryKeys,
  invalidateDomainQueries
} from "@/lib/query/invalidate-domain-cache";
import { queryKeys } from "@/lib/query/query-keys";

describe("query invalidation map", () => {
  it("invalida dashboard, piggy bank e goals dopo una transazione", async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);

    await invalidateDomainQueries({ invalidateQueries }, "transactions");

    expect(getInvalidationQueryKeys("transactions")).toEqual([
      queryKeys.transactions.all,
      queryKeys.dashboard,
      queryKeys.piggyBank.all,
      queryKeys.savingGoals.all
    ]);
    expect(invalidateQueries.mock.calls).toEqual([
      [{ queryKey: queryKeys.transactions.all }],
      [{ queryKey: queryKeys.dashboard }],
      [{ queryKey: queryKeys.piggyBank.all }],
      [{ queryKey: queryKeys.savingGoals.all }]
    ]);
  });

  it("invalida anche il salvadanaio dopo un contributo goal", async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);

    await invalidateDomainQueries({ invalidateQueries }, "saving-goals");

    expect(getInvalidationQueryKeys("saving-goals")).toEqual([
      queryKeys.savingGoals.all,
      queryKeys.dashboard,
      queryKeys.piggyBank.all
    ]);
  });

  it("invalida dashboard e goal dopo modifiche al salvadanaio", async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);

    await invalidateDomainQueries({ invalidateQueries }, "piggy-bank");

    expect(getInvalidationQueryKeys("piggy-bank")).toEqual([
      queryKeys.piggyBank.all,
      queryKeys.dashboard,
      queryKeys.savingGoals.all
    ]);
  });
});
