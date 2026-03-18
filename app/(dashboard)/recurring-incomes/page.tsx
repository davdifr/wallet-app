import { RecurringIncomesWorkspace } from "@/components/recurring-incomes/recurring-incomes-workspace";
import { NoticeCard } from "@/components/ui/notice-card";
import { getSupabasePageErrorMessage } from "@/lib/supabase/error-message";
import {
  listRecurringIncomes,
  materializeRecurringIncomes
} from "@/services/recurring-incomes/recurring-income-service";

export default async function RecurringIncomesPage() {
  try {
    await materializeRecurringIncomes();
    const recurringIncomes = await listRecurringIncomes();
    return <RecurringIncomesWorkspace initialRecurringIncomes={recurringIncomes} />;
  } catch (error) {
    return (
      <NoticeCard
        title="Sezione recurring incomes non disponibile"
        message={getSupabasePageErrorMessage(error)}
      />
    );
  }
}
