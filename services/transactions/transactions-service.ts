import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type {
  Transaction,
  TransactionFilters,
  TransactionFormValues
} from "@/types/transactions";

type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];
type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];
type TransactionUpdate = Database["public"]["Tables"]["transactions"]["Update"];

function buildTransactionDescription(values: {
  category: string;
  source: string;
  type: "expense" | "income";
}) {
  return `${values.type === "income" ? "Income" : "Expense"} · ${values.category} · ${values.source}`;
}

function mapTransaction(row: Database["public"]["Tables"]["transactions"]["Row"]): Transaction {
  return {
    id: row.id,
    amount: row.amount,
    date: row.transaction_date,
    category: row.category ?? "Uncategorized",
    note: row.notes ?? "",
    source: row.merchant ?? row.description,
    type: row.transaction_type === "income" ? "income" : "expense",
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

  if (category) {
    query = query.eq("category", category);
  }

  if (type && type !== "all") {
    query = query.eq("transaction_type", type);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows: TransactionRow[] = data ?? [];

  return rows.map(mapTransaction);
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
    .select("category")
    .in("transaction_type", ["expense", "income"])
    .not("category", "is", null)
    .order("category", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Array<{ category: string | null }>;

  return Array.from(
    new Set(
      rows
        .map((item) => item.category?.trim())
        .filter((item): item is string => Boolean(item))
    )
  );
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
  values: Omit<TransactionFormValues, "id">
) {
  const supabase = await createSupabaseServerClient();

  const payload: TransactionInsert = {
    user_id: userId,
    amount: Number(values.amount),
    transaction_date: values.date,
    category: values.category,
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
  values: Omit<TransactionFormValues, "id">
) {
  const supabase = await createSupabaseServerClient();

  const payload: TransactionUpdate = {
    amount: Number(values.amount),
    transaction_date: values.date,
    category: values.category,
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
