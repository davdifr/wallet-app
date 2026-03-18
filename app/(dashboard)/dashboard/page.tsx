import { DashboardWorkspace } from "@/components/dashboard/dashboard-workspace";
import { DailyBudgetCard } from "@/components/dashboard/daily-budget-card";
import { MonthlyOverviewCard } from "@/components/dashboard/monthly-overview-card";
import { RecentActivityCard } from "@/components/dashboard/recent-activity-card";
import { SavingGoalsStatusCard } from "@/components/dashboard/saving-goals-status-card";
import { TopCategoriesCard } from "@/components/dashboard/top-categories-card";
import { NoticeCard } from "@/components/ui/notice-card";
import { getSupabasePageErrorMessage } from "@/lib/supabase/error-message";
import {
  getDashboardData,
  serializeDashboardData
} from "@/services/dashboard/dashboard-service";

export default async function DashboardPage() {
  try {
    const data = await getDashboardData();

    return <DashboardWorkspace initialData={serializeDashboardData(data)} />;
  } catch (error) {
    return (
      <NoticeCard
        title="Dashboard non disponibile"
        message={getSupabasePageErrorMessage(error)}
      />
    );
  }
}
