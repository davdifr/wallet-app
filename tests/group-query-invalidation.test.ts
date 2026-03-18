import { describe, expect, it, vi } from "vitest";

import {
  getInvalidationQueryKeys,
  invalidateDomainQueries
} from "@/lib/query/invalidate-domain-cache";
import { queryKeys } from "@/lib/query/query-keys";

describe("group query invalidation", () => {
  it("invalida lista e dettaglio gruppi dopo mutazioni del dominio", async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);

    await invalidateDomainQueries({ invalidateQueries }, "groups");

    expect(getInvalidationQueryKeys("groups")).toEqual([
      queryKeys.groups.all,
      queryKeys.groups.detailRoot
    ]);
    expect(invalidateQueries.mock.calls).toEqual([
      [{ queryKey: queryKeys.groups.all }],
      [{ queryKey: queryKeys.groups.detailRoot }]
    ]);
  });
});
