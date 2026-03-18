"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { DailyBudgetCard } from "@/components/dashboard/daily-budget-card";
import { PiggyBankCard } from "@/components/dashboard/piggy-bank-card";
import { RecentActivityCard } from "@/components/dashboard/recent-activity-card";
import { SavingGoalsStatusCard } from "@/components/dashboard/saving-goals-status-card";
import { TopCategoriesCard } from "@/components/dashboard/top-categories-card";
import { useSyncSourceId } from "@/components/providers/dashboard-query-provider";
import { NoticeCard } from "@/components/ui/notice-card";
import { fetchJson } from "@/lib/query/fetch-json";
import { invalidateDomainQueries } from "@/lib/query/invalidate-domain-cache";
import { queryKeys } from "@/lib/query/query-keys";
import { publishSyncEvent } from "@/lib/query/sync-events";
import type { DashboardApiData } from "@/types/dashboard";
import type {
  PiggyBankMovementFormValues,
  PiggyBankSettingsFormValues,
  PiggyBankSummary
} from "@/types/piggy-bank";

type DashboardWorkspaceProps = {
  initialData: DashboardApiData;
};

export function DashboardWorkspace({ initialData }: DashboardWorkspaceProps) {
  const stableInitialData = useMemo(() => initialData, [initialData]);
  const queryClient = useQueryClient();
  const syncSourceId = useSyncSourceId();
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
  const updatePiggyBankSettingsMutation = useMutation({
    mutationFn: async (values: PiggyBankSettingsFormValues) =>
      fetchJson<{ piggyBank: PiggyBankSummary }>("/api/piggy-bank/settings", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      })
  });
  const createPiggyBankMovementMutation = useMutation({
    mutationFn: async (values: PiggyBankMovementFormValues) =>
      fetchJson<{ piggyBank: PiggyBankSummary }>("/api/piggy-bank/movements", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      })
  });

  if (dashboardQuery.error instanceof Error) {
    return (
      <NoticeCard title="Dashboard non disponibile" message={dashboardQuery.error.message} />
    );
  }

  const data = dashboardQuery.data ?? stableInitialData;

  async function syncBudgetDomains() {
    await invalidateDomainQueries(queryClient, "piggy-bank");

    publishSyncEvent({
      id: crypto.randomUUID(),
      domain: "piggy-bank",
      sourceId: syncSourceId,
      timestamp: Date.now()
    });
  }

  return (
    <div className="space-y-5 pb-12 sm:space-y-6">
      <section>
        <DailyBudgetCard result={data.dailyBudget} totalWealth={data.totalWealthLabel} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <PiggyBankCard
          summary={data.piggyBankSummary}
          onSubmitMovement={async (values) => {
            try {
              await createPiggyBankMovementMutation.mutateAsync(values);
              await syncBudgetDomains();
              return "Movimento salvato.";
            } catch (error) {
              return error instanceof Error
                ? error.message
                : "Impossibile salvare il movimento.";
            }
          }}
          onSubmitSettings={async (values) => {
            try {
              await updatePiggyBankSettingsMutation.mutateAsync(values);
              await syncBudgetDomains();
              return "Piano aggiornato.";
            } catch (error) {
              return error instanceof Error
                ? error.message
                : "Impossibile aggiornare il piano.";
            }
          }}
        />
        <SavingGoalsStatusCard goals={data.goals} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <RecentActivityCard items={data.recentActivity} />
        <TopCategoriesCard categories={data.topCategories} />
      </section>
    </div>
  );
}
