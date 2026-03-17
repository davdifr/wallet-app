import type { Database } from "@/types/database";

export type RecurringIncomeFrequency = Extract<
  Database["public"]["Tables"]["recurring_incomes"]["Row"]["frequency"],
  "weekly" | "monthly" | "yearly"
>;

export type RecurringIncome = {
  id: string;
  amount: number;
  category: string;
  description: string;
  source: string;
  frequency: RecurringIncomeFrequency;
  startsOn: string;
  endsOn: string | null;
  nextOccurrenceOn: string;
  isActive: boolean;
  createdAt: string;
};

export type RecurringIncomeFormValues = {
  amount: string;
  category: string;
  description: string;
  source: string;
  frequency: RecurringIncomeFrequency;
  startsOn: string;
  endsOn: string;
};

export type RecurringIncomeFormState = {
  success: boolean;
  message?: string;
  errors?: Partial<
    Record<keyof RecurringIncomeFormValues | "general", string[]>
  >;
};

export type MaterializeRecurringIncomesResult = {
  processedRecurringIncomes: number;
  createdTransactions: number;
  skippedDuplicates: number;
};
