import { DailyBudgetCard } from "@/components/dashboard/daily-budget-card";
import { MonthlyBreakdownCard } from "@/components/dashboard/monthly-breakdown-card";
import { MonthlyOverviewCard } from "@/components/dashboard/monthly-overview-card";
import { RecentActivityCard } from "@/components/dashboard/recent-activity-card";
import { SavingGoalsStatusCard } from "@/components/dashboard/saving-goals-status-card";
import { TopCategoriesCard } from "@/components/dashboard/top-categories-card";
import { NoticeCard } from "@/components/ui/notice-card";
import { getSupabasePageErrorMessage } from "@/lib/supabase/error-message";
import { getDashboardData } from "@/services/dashboard/dashboard-service";

export default async function DashboardPage() {
  try {
    const data = await getDashboardData();

    return (
      <div className="space-y-5 pb-3 sm:space-y-6">
        <section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
          <MonthlyOverviewCard
            balance={data.balanceLabel}
            income={data.incomeLabel}
            expenses={data.expensesLabel}
            savingsRate={data.savingsRateLabel}
            trend={data.trend}
          />
          <MonthlyBreakdownCard
            balance={data.balanceLabel}
            expenses={data.expensesLabel}
            incomes={data.incomeLabel}
            savingsTarget={data.savingsTargetLabel}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <DailyBudgetCard input={data.dailyBudgetInput} />
          <TopCategoriesCard categories={data.topCategories} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <SavingGoalsStatusCard goals={data.goals} />
          <RecentActivityCard items={data.recentActivity} />
        </section>
      </div>
    );
  } catch (error) {
    return (
      <NoticeCard
        title="Dashboard non disponibile"
        message={getSupabasePageErrorMessage(error)}
      />
    );
  }
}
