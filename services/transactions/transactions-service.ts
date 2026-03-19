import {
  getCategoryDefinition,
  getFallbackCategory,
  getCategoryLabel,
  isValidCategorySlug,
  resolveExpenseCategoryCompatibility,
  resolveIncomeCategoryCompatibility
} from "@/lib/categories/catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type {
  Transaction,
  TransactionCategoryOption,
  TransactionFilters,
  TransactionFormValues
} from "@/types/transactions";

type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];
type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];
type TransactionUpdate = Database["public"]["Tables"]["transactions"]["Update"];
type PersistableTransactionValues = Omit<TransactionFormValues, "id" | "category"> & {
  category: string;
};
const LEGACY_CATEGORY_FILTER_PREFIX = "legacy:";

function buildTransactionDescription(values: {
  category: string;
  source: string;
  type: "expense" | "income";
}) {
  return `${values.type === "income" ? "Income" : "Expense"} · ${values.category} · ${values.source}`;
}

function mapTransaction(row: Database["public"]["Tables"]["transactions"]["Row"]): Transaction {
  const type = row.transaction_type === "income" ? "income" : "expense";
  const persistedCategory =
    row.category_slug && isValidCategorySlug(row.category_slug, type)
      ? getCategoryDefinition(row.category_slug)
      : null;
  const compatibility =
    persistedCategory
      ? {
          slug: persistedCategory.slug,
          displayLabel: row.category?.trim() || persistedCategory.label,
          canonicalLabel: persistedCategory.label,
          originalLabel: row.category?.trim() || null,
          isLegacyFallback: false,
          wasMatched: true
        }
      : type === "income"
        ? resolveIncomeCategoryCompatibility(row.category)
        : resolveExpenseCategoryCompatibility(row.category);

  return {
    id: row.id,
    amount: row.amount,
    date: row.transaction_date,
    category: compatibility.displayLabel,
    categorySlug: compatibility.slug,
    isLegacyCategoryFallback: compatibility.isLegacyFallback,
    note: row.notes ?? "",
    source: row.merchant ?? row.description,
    type,
    createdAt: row.created_at
  };
}

function getMonthRange(month?: string) {
  if (!month) {
    return null;
  }

  const [year, monthNumber] = month.split("-").map(Number);

  if (!year || !monthNumber) {
    return null;
  }

  const from = new Date(Date.UTC(year, monthNumber - 1, 1));
  const to = new Date(Date.UTC(year, monthNumber, 0));

  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10)
  };
}

function buildLegacyTransactionCategoryValue(category: string, type: "expense" | "income") {
  return `${LEGACY_CATEGORY_FILTER_PREFIX}${type}:${encodeURIComponent(category)}`;
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

export async function listTransactions(filters: TransactionFilters = {}) {
  const supabase = await createSupabaseServerClient();
  const { month, category, type } = filters;

  let query = supabase
    .from("transactions")
    .select("*")
    .in("transaction_type", ["expense", "income"])
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  const monthRange = getMonthRange(month);

  if (monthRange) {
    query = query
      .gte("transaction_date", monthRange.from)
      .lte("transaction_date", monthRange.to);
  }

  if (type && type !== "all") {
    query = query.eq("transaction_type", type);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows: TransactionRow[] = data ?? [];
  const mappedTransactions = rows.map(mapTransaction);

  if (!category) {
    return mappedTransactions;
  }

  if (isValidCategorySlug(category)) {
    return mappedTransactions.filter((transaction) => transaction.categorySlug === category);
  }

  const legacyCategory = parseLegacyTransactionCategoryValue(category);

  if (legacyCategory) {
    return mappedTransactions.filter(
      (transaction) =>
        transaction.type === legacyCategory.type &&
        transaction.isLegacyCategoryFallback &&
        transaction.category === legacyCategory.category
    );
  }

  return mappedTransactions.filter((transaction) => transaction.category === category);
}

export async function getTransactionById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    throw new Error(error.message);
  }

  return mapTransaction(data as TransactionRow);
}

export async function listTransactionCategories() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("category, transaction_type")
    .in("transaction_type", ["expense", "income"])
    .not("category", "is", null)
    .order("transaction_type", { ascending: true })
    .order("category", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Array<{
    category: string | null;
    transaction_type: "expense" | "income" | null;
  }>;
  const optionsByValue = new Map<string, TransactionCategoryOption>();

  for (const row of rows) {
    const rawCategory = row.category?.trim();
    const rowType = row.transaction_type === "income" ? "income" : "expense";

    if (!rawCategory) {
      continue;
    }

    const compatibility =
      rowType === "income"
        ? resolveIncomeCategoryCompatibility(rawCategory)
        : resolveExpenseCategoryCompatibility(rawCategory);

    if (compatibility.wasMatched) {
      optionsByValue.set(compatibility.slug, {
        value: compatibility.slug,
        label: compatibility.displayLabel,
        categorySlug: compatibility.slug,
        type: rowType,
        isLegacy: false
      });
      continue;
    }

    const fallbackCategory = getFallbackCategory(rowType);
    const legacyValue = buildLegacyTransactionCategoryValue(rawCategory, rowType);

    optionsByValue.set(legacyValue, {
      value: legacyValue,
      label: rawCategory,
      categorySlug: fallbackCategory.slug,
      type: rowType,
      isLegacy: true
    });
  }

  return Array.from(optionsByValue.values()).sort((left, right) => {
    if (left.isLegacy !== right.isLegacy) {
      return left.isLegacy ? 1 : -1;
    }

    if (left.type !== right.type) {
      return left.type.localeCompare(right.type);
    }

    return left.label.localeCompare(right.label, "it");
  });
}

export async function listTransactionMonths() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("transaction_date")
    .in("transaction_type", ["expense", "income"])
    .order("transaction_date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Array<{ transaction_date: string }>;

  return Array.from(
    new Set(rows.map((item) => item.transaction_date.slice(0, 7)))
  ).sort((left, right) => right.localeCompare(left));
}

export async function createTransaction(
  userId: string,
  values: PersistableTransactionValues
) {
  const supabase = await createSupabaseServerClient();

  const payload: TransactionInsert = {
    user_id: userId,
    amount: Number(values.amount),
    transaction_date: values.date,
    category: getCategoryLabel(values.categorySlug, values.type),
    category_slug: values.categorySlug,
    notes: values.note || null,
    merchant: values.source,
    description: buildTransactionDescription(values),
    transaction_type: values.type,
    currency: "EUR"
  };

  const { data, error } = await supabase
    .from("transactions")
    .insert(payload as never)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapTransaction(data as TransactionRow);
}

export async function updateTransaction(
  transactionId: string,
  values: PersistableTransactionValues
) {
  const supabase = await createSupabaseServerClient();

  const payload: TransactionUpdate = {
    amount: Number(values.amount),
    transaction_date: values.date,
    category: getCategoryLabel(values.categorySlug, values.type),
    category_slug: values.categorySlug,
    notes: values.note || null,
    merchant: values.source,
    description: buildTransactionDescription(values),
    transaction_type: values.type
  };

  const { data, error } = await supabase
    .from("transactions")
    .update(payload as never)
    .eq("id", transactionId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapTransaction(data as TransactionRow);
}

export async function deleteTransaction(transactionId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapTransaction(data as TransactionRow);
}
