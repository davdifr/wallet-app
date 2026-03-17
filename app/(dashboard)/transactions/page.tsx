import { TransactionsWorkspace } from "@/components/transactions/transactions-workspace";
import { NoticeCard } from "@/components/ui/notice-card";
import { getSupabasePageErrorMessage } from "@/lib/supabase/error-message";
import {
  getTransactionById,
  listTransactionCategories,
  listTransactionMonths,
  listTransactions
} from "@/services/transactions/transactions-service";
import type { TransactionFilters } from "@/types/transactions";

type TransactionsPageProps = {
  searchParams: Promise<{
    category?: string;
    edit?: string;
    month?: string;
    type?: "all" | "expense" | "income";
  }>;
};

export default async function TransactionsPage({
  searchParams
}: TransactionsPageProps) {
  const params = await searchParams;

  const filters: TransactionFilters = {
    category: params.category,
    month: params.month,
    type: params.type
  };

  let transactions: Awaited<ReturnType<typeof listTransactions>> = [];
  let categories: Awaited<ReturnType<typeof listTransactionCategories>> = [];
  let availableMonths: Awaited<ReturnType<typeof listTransactionMonths>> = [];
  let editingTransaction: Awaited<ReturnType<typeof getTransactionById>> = null;
  let pageError: string | null = null;

  try {
    [transactions, categories, availableMonths, editingTransaction] = await Promise.all([
      listTransactions(filters),
      listTransactionCategories(),
      listTransactionMonths(),
      params.edit ? getTransactionById(params.edit) : Promise.resolve(null)
    ]);
  } catch (error) {
    pageError = getSupabasePageErrorMessage(error);
  }

  if (pageError) {
    return (
      <NoticeCard
        title="Sezione transazioni non disponibile"
        message={pageError}
      />
    );
  }

  return (
    <TransactionsWorkspace
      availableMonths={availableMonths}
      categories={categories}
      initialEditingTransaction={editingTransaction}
      initialFilters={filters}
      initialTransactions={transactions}
    />
  );
}
