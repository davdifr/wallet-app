import type { ExpenseCategorySlug, IncomeCategorySlug } from "@/lib/categories/catalog";
import type { Database } from "@/types/database";

export type TransactionType = Extract<
  Database["public"]["Enums"]["transaction_type"],
  "expense" | "income"
>;

export type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];

export type Transaction = {
  id: string;
  amount: number;
  date: string;
  category: string;
  categorySlug?: ExpenseCategorySlug | IncomeCategorySlug | null;
  isLegacyCategoryFallback?: boolean;
  note: string;
  source: string;
  type: TransactionType;
  createdAt: string;
};

export type TransactionCategoryOption = {
  value: string;
  label: string;
  categorySlug: ExpenseCategorySlug | IncomeCategorySlug;
  type: TransactionType;
  isLegacy: boolean;
};

export type TransactionFilters = {
  month?: string;
  category?: string;
  type?: TransactionType | "all";
};

export type TransactionFormValues = {
  id?: string;
  amount: string;
  date: string;
  category?: string;
  categorySlug: ExpenseCategorySlug | IncomeCategorySlug;
  note: string;
  source: string;
  type: TransactionType;
};

export type TransactionFormState = {
  success: boolean;
  message?: string;
  errors?: Partial<Record<keyof TransactionFormValues, string[]>>;
};
