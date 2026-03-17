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
  note: string;
  source: string;
  type: TransactionType;
  createdAt: string;
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
  category: string;
  note: string;
  source: string;
  type: TransactionType;
};

export type TransactionFormState = {
  success: boolean;
  message?: string;
  errors?: Partial<Record<keyof TransactionFormValues, string[]>>;
};
