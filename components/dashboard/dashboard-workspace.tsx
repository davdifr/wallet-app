"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { DailyBudgetCard } from "@/components/dashboard/daily-budget-card";
import { MonthlyOverviewCard } from "@/components/dashboard/monthly-overview-card";
import { RecentActivityCard } from "@/components/dashboard/recent-activity-card";
import { SavingGoalsStatusCard } from "@/components/dashboard/saving-goals-status-card";
import { TopCategoriesCard } from "@/components/dashboard/top-categories-card";
import { NoticeCard } from "@/components/ui/notice-card";
import { fetchJson } from "@/lib/query/fetch-json";
import { queryKeys } from "@/lib/query/query-keys";
import type { DashboardApiData } from "@/services/dashboard/dashboard-service";

type DashboardWorkspaceProps = {
  initialData: DashboardApiData;
};

function normalizeDashboardData(data: DashboardApiData) {
  return {
    ...data,
    dailyBudgetInput: {
      ...data.dailyBudgetInput,
      currentDate: new Date(data.dailyBudgetInput.currentDate)
    }
  };
}

export function DashboardWorkspace({ initialData }: DashboardWorkspaceProps) {
  const stableInitialData = useMemo(() => initialData, [initialData]);
  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () =>
      fetchJson<DashboardApiData>("/api/dashboard", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store"
      }),
    initialData: stableInitialData,
    placeholderData: (previousData) => previousData
  });

  if (dashboardQuery.error instanceof Error) {
    return (
      <NoticeCard title="Dashboard non disponibile" message={dashboardQuery.error.message} />
    );
  }

  const data = normalizeDashboardData(dashboardQuery.data ?? stableInitialData);

  return (
    <div className="space-y-5 pb-12 sm:space-y-6">
      <MonthlyOverviewCard
        balance={data.balanceLabel}
        income={data.incomeLabel}
        expenses={data.expensesLabel}
        savingsRate={data.savingsRateLabel}
        trend={data.trend}
      />

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
}
