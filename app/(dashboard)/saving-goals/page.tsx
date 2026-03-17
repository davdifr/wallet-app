import { SavingGoalsWorkspace } from "@/components/saving-goals/saving-goals-workspace";
import { NoticeCard } from "@/components/ui/notice-card";
import { getSupabasePageErrorMessage } from "@/lib/supabase/error-message";
import { listSavingGoals } from "@/services/saving-goals/saving-goals-service";

export default async function SavingGoalsPage() {
  try {
    const goals = await listSavingGoals();
    return <SavingGoalsWorkspace initialGoals={goals} />;
  } catch (error) {
    return (
      <NoticeCard
        title="Sezione saving goals non disponibile"
        message={getSupabasePageErrorMessage(error)}
      />
    );
  }
}
