import type {
  Transaction,
  TransactionCategoryOption,
  TransactionFilters
} from "@/types/transactions";

export type TransactionsListCache = {
  availableMonths: string[];
  categories: TransactionCategoryOption[];
  transactions: Transaction[];
};

const LEGACY_CATEGORY_FILTER_PREFIX = "legacy:";

function sortTransactions(transactions: Transaction[]) {
  return [...transactions].sort((left, right) => {
    if (left.date !== right.date) {
      return right.date.localeCompare(left.date);
    }

    return right.createdAt.localeCompare(left.createdAt);
  });
}

function parseLegacyTransactionCategoryValue(value: string) {
  if (!value.startsWith(LEGACY_CATEGORY_FILTER_PREFIX)) {
    return null;
  }

  const [type, encodedCategory] = value
    .slice(LEGACY_CATEGORY_FILTER_PREFIX.length)
    .split(":", 2);

  if ((type !== "expense" && type !== "income") || !encodedCategory) {
    return null;
  }

  return {
    type,
    category: decodeURIComponent(encodedCategory)
  } as const;
}

export function matchesTransactionFilters(
  transaction: Transaction,
  filters: TransactionFilters
) {
  if (filters.type && filters.type !== "all" && transaction.type !== filters.type) {
    return false;
  }

  if (filters.month && transaction.date.slice(0, 7) !== filters.month) {
    return false;
  }

  if (!filters.category) {
    return true;
  }

  if (filters.category === transaction.categorySlug || filters.category === transaction.category) {
    return true;
  }

  const legacyCategory = parseLegacyTransactionCategoryValue(filters.category);

  if (!legacyCategory) {
    return false;
  }

  return (
    transaction.type === legacyCategory.type &&
    transaction.isLegacyCategoryFallback === true &&
    transaction.category === legacyCategory.category
  );
}

export function upsertTransactionInCache(
  cache: TransactionsListCache,
  transaction: Transaction,
  filters: TransactionFilters
) {
  const withoutCurrent = cache.transactions.filter((item) => item.id !== transaction.id);

  if (!matchesTransactionFilters(transaction, filters)) {
    return {
      ...cache,
      transactions: withoutCurrent
    };
  }

  return {
    ...cache,
    transactions: sortTransactions([transaction, ...withoutCurrent])
  };
}

export function removeTransactionFromCache(
  cache: TransactionsListCache,
  transactionId: string
) {
  return {
    ...cache,
    transactions: cache.transactions.filter((item) => item.id !== transactionId)
  };
}