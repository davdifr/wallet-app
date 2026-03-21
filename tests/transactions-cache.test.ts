import { describe, expect, it } from "vitest";

import {
  matchesTransactionFilters,
  removeTransactionFromCache,
  upsertTransactionInCache,
  type TransactionsListCache
} from "@/lib/query/transactions-cache";
import type { Transaction } from "@/types/transactions";

function buildTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "tx-1",
    amount: 42,
    date: "2026-03-20",
    category: "Spesa alimentare",
    categorySlug: "groceries",
    isLegacyCategoryFallback: false,
    note: "",
    source: "Carta",
    type: "expense",
    createdAt: "2026-03-20T10:00:00.000Z",
    ...overrides
  };
}

function buildCache(transactions: Transaction[]): TransactionsListCache {
  return {
    transactions,
    availableMonths: ["2026-03"],
    categories: []
  };
}

describe("transactions cache helpers", () => {
  it("riconosce i filtri mese/tipo/categoria", () => {
    const transaction = buildTransaction();

    expect(
      matchesTransactionFilters(transaction, {
        month: "2026-03",
        type: "expense",
        category: "groceries"
      })
    ).toBe(true);

    expect(
      matchesTransactionFilters(transaction, {
        month: "2026-04"
      })
    ).toBe(false);
  });

  it("aggiunge o aggiorna solo le transazioni visibili nel filtro corrente", () => {
    const cache = buildCache([buildTransaction({ id: "tx-older", date: "2026-03-18" })]);
    const updated = upsertTransactionInCache(
      cache,
      buildTransaction({ id: "tx-newer", date: "2026-03-21", createdAt: "2026-03-21T09:00:00.000Z" }),
      { type: "expense", month: "2026-03" }
    );

    expect(updated.transactions.map((item) => item.id)).toEqual(["tx-newer", "tx-older"]);

    const removedByFilter = upsertTransactionInCache(
      updated,
      buildTransaction({ id: "tx-newer", type: "income", categorySlug: "salary", category: "Stipendio" }),
      { type: "expense", month: "2026-03" }
    );

    expect(removedByFilter.transactions.map((item) => item.id)).toEqual(["tx-older"]);
  });

  it("rimuove una transazione senza toccare il resto della cache", () => {
    const cache = buildCache([buildTransaction({ id: "tx-1" }), buildTransaction({ id: "tx-2" })]);

    expect(removeTransactionFromCache(cache, "tx-1").transactions.map((item) => item.id)).toEqual([
      "tx-2"
    ]);
  });
});