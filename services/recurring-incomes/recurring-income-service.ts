import {
  getExpenseCategoryDefinition,
  getIncomeCategoryDefinition,
  getCategoryLabel,
  resolveExpenseCategoryCompatibility,
  resolveIncomeCategoryCompatibility
} from "@/lib/categories/catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type {
  MaterializeRecurringIncomesResult,
  RecurringIncome,
  RecurringIncomeFormValues
} from "@/types/recurring-incomes";

type RecurringIncomeInsert =
  Database["public"]["Tables"]["recurring_incomes"]["Insert"];
type RecurringIncomeRow = Database["public"]["Tables"]["recurring_incomes"]["Row"];
type RecurringIncomeUpdate =
  Database["public"]["Tables"]["recurring_incomes"]["Update"];
type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];
type PersistableRecurringIncomeValues = Omit<
  RecurringIncomeFormValues,
  "categorySlug" | "category"
> & {
  categorySlug: RecurringIncomeFormValues["categorySlug"];
  category: string;
};

class RecurringIncomeServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "RecurringIncomeServiceError";
    this.statusCode = statusCode;
  }
}

function mapRecurringIncome(
  row: Database["public"]["Tables"]["recurring_incomes"]["Row"]
): RecurringIncome {
  const transactionType = row.transaction_type === "expense" ? "expense" : "income";
  const persistedCategory =
    transactionType === "income"
      ? getIncomeCategoryDefinition(row.category_slug)
      : getExpenseCategoryDefinition(row.category_slug);
  const compatibility = persistedCategory
    ? {
        slug: persistedCategory.slug,
        displayLabel: row.category?.trim() || persistedCategory.label,
        canonicalLabel: persistedCategory.label,
        originalLabel: row.category?.trim() || null,
        isLegacyFallback: false,
        wasMatched: true
      }
    : transactionType === "income"
      ? resolveIncomeCategoryCompatibility(row.category)
      : resolveExpenseCategoryCompatibility(row.category);

  return {
    id: row.id,
    amount: row.amount,
    type: transactionType,
    category: compatibility.displayLabel,
    categorySlug: compatibility.slug,
    isLegacyCategoryFallback: compatibility.isLegacyFallback,
    description: row.description,
    source: row.source,
    frequency:
      row.frequency === "weekly" || row.frequency === "monthly" || row.frequency === "yearly"
        ? row.frequency
        : "monthly",
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    nextOccurrenceOn: row.next_occurrence_on,
    isActive: row.is_active,
    createdAt: row.created_at
  };
}

function toIsoDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function addMonths(date: Date, months: number) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const lastDayOfTargetMonth = new Date(Date.UTC(year, month + months + 1, 0)).getUTCDate();

  return new Date(
    Date.UTC(year, month + months, Math.min(day, lastDayOfTargetMonth))
  );
}

export function getNextOccurrenceDate(
  currentDate: string,
  frequency: "weekly" | "monthly" | "yearly"
) {
  const base = parseDate(currentDate);

  switch (frequency) {
    case "weekly":
      return toIsoDate(new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000));
    case "monthly":
      return toIsoDate(addMonths(base, 1));
    case "yearly":
      return toIsoDate(addMonths(base, 12));
  }
}

function buildRecurringTransactionDescription(values: {
  type: "income" | "expense";
  category: string;
  description: string;
  source: string;
}) {
  return `Recurring ${values.type} · ${values.category} · ${values.description} · ${values.source}`;
}

function getRecurringInstanceKey(recurringIncomeId: string, occurrenceDate: string) {
  return `${recurringIncomeId}:${occurrenceDate}`;
}

export async function listRecurringIncomes() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("recurring_incomes")
    .select("*")
    .in("frequency", ["weekly", "monthly", "yearly"])
    .order("is_active", { ascending: false })
    .order("next_occurrence_on", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data.map(mapRecurringIncome);
}

export async function createRecurringIncome(
  userId: string,
  values: PersistableRecurringIncomeValues
) {
  const supabase = await createSupabaseServerClient();

  const payload: RecurringIncomeInsert = {
    user_id: userId,
    amount: Number(values.amount),
    transaction_type: values.type,
    category: getCategoryLabel(values.categorySlug, values.type),
    category_slug: values.categorySlug,
    description: values.description,
    source: values.source,
    frequency: values.frequency,
    starts_on: values.startsOn,
    ends_on: values.endsOn || null,
    next_occurrence_on: values.startsOn,
    currency: "EUR",
    is_active: true
  };

  const { data, error } = await supabase
    .from("recurring_incomes")
    .insert(payload as never)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRecurringIncome(data as RecurringIncomeRow);
}

async function getOwnedRecurringIncome(userId: string, id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("recurring_incomes")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new RecurringIncomeServiceError("Ricorrenza non trovata.", 404);
    }

    throw new Error(error.message);
  }

  return data as RecurringIncomeRow;
}

export async function setRecurringIncomeActiveState(
  userId: string,
  id: string,
  isActive: boolean
) {
  await getOwnedRecurringIncome(userId, id);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("recurring_incomes")
    .update({ is_active: isActive } as RecurringIncomeUpdate as never)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRecurringIncome(data as RecurringIncomeRow);
}

export async function deleteRecurringIncome(userId: string, id: string) {
  const recurringIncome = await getOwnedRecurringIncome(userId, id);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("recurring_incomes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return mapRecurringIncome(recurringIncome);
}

export async function materializeRecurringIncomes(
  currentDate = new Date()
): Promise<MaterializeRecurringIncomesResult> {
  const supabase = await createSupabaseServerClient();
  const today = toIsoDate(
    new Date(
      Date.UTC(
        currentDate.getUTCFullYear(),
        currentDate.getUTCMonth(),
        currentDate.getUTCDate()
      )
    )
  );

  const { data: recurringIncomes, error } = await supabase
    .from("recurring_incomes")
    .select("*")
    .eq("is_active", true)
    .in("frequency", ["weekly", "monthly", "yearly"])
    .lte("next_occurrence_on", today)
    .order("next_occurrence_on", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const recurringIncomeRows: RecurringIncomeRow[] = recurringIncomes ?? [];

  const dueRecurringIncomes = recurringIncomeRows.filter((item) => {
    if (!item.ends_on) {
      return true;
    }

    return item.ends_on >= item.next_occurrence_on;
  });

  let createdTransactions = 0;
  let skippedDuplicates = 0;

  for (const recurringIncome of dueRecurringIncomes) {
    let occurrenceDate = recurringIncome.next_occurrence_on;
    const frequency =
      recurringIncome.frequency === "weekly" ||
      recurringIncome.frequency === "monthly" ||
      recurringIncome.frequency === "yearly"
        ? recurringIncome.frequency
        : "monthly";

    while (occurrenceDate <= today) {
      if (recurringIncome.ends_on && occurrenceDate > recurringIncome.ends_on) {
        break;
      }

      const transactionType =
        recurringIncome.transaction_type === "expense" ? "expense" : "income";
      const compatibility =
        transactionType === "income"
          ? resolveIncomeCategoryCompatibility(recurringIncome.category)
          : resolveExpenseCategoryCompatibility(recurringIncome.category);
      const categorySlug =
        transactionType === "income"
          ? getIncomeCategoryDefinition(recurringIncome.category_slug)?.slug ?? compatibility.slug
          : getExpenseCategoryDefinition(recurringIncome.category_slug)?.slug ?? compatibility.slug;

      const transactionPayload: TransactionInsert = {
        user_id: recurringIncome.user_id,
        amount: recurringIncome.amount,
        transaction_date: occurrenceDate,
        category: compatibility.canonicalLabel,
        category_slug: categorySlug,
        notes: `Generata automaticamente da ricorrenza ${recurringIncome.frequency}.`,
        merchant: recurringIncome.source,
        description: buildRecurringTransactionDescription({
          type: transactionType,
          category: compatibility.canonicalLabel,
          description: recurringIncome.description,
          source: recurringIncome.source
        }),
        transaction_type: transactionType,
        currency: recurringIncome.currency,
        recurring_income_id: recurringIncome.id,
        recurring_occurrence_date: occurrenceDate,
        recurring_income_instance_key: getRecurringInstanceKey(
          recurringIncome.id,
          occurrenceDate
        )
      };

      const { error: transactionError } = await supabase
        .from("transactions")
        .insert(transactionPayload as never);

      if (transactionError) {
        if (transactionError.code === "23505") {
          skippedDuplicates += 1;
        } else {
          throw new Error(transactionError.message);
        }
      } else {
        createdTransactions += 1;
      }

      occurrenceDate = getNextOccurrenceDate(occurrenceDate, frequency);
    }

    const isStillActive =
      recurringIncome.ends_on ? occurrenceDate <= recurringIncome.ends_on : true;

    const { error: updateError } = await supabase
      .from("recurring_incomes")
      .update({
        next_occurrence_on: occurrenceDate,
        is_active: isStillActive
      } as RecurringIncomeUpdate as never)
      .eq("id", recurringIncome.id);

    if (updateError) {
      throw new Error(updateError.message);
    }
  }

  return {
    processedRecurringIncomes: dueRecurringIncomes.length,
    createdTransactions,
    skippedDuplicates
  };
}
