import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { DashboardShellCard } from "@/components/dashboard/dashboard-shell-card";

type ActivityItem = {
  label: string;
  time: string;
  amount: string;
  type: "income" | "expense";
};

type RecentActivityCardProps = {
  items: ActivityItem[];
};

export function RecentActivityCard({ items }: RecentActivityCardProps) {
  return (
    <DashboardShellCard
      title="Attivita Recenti"
      subtitle="Ultimi movimenti rilevanti del wallet"
      contentClassName="space-y-3"
    >
      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-10 text-center text-sm text-slate-500">
          Nessuna attivita recente disponibile.
        </div>
      ) : (
        items.map((item) => {
          const isIncome = item.type === "income";
          const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;

          return (
            <div
              key={`${item.label}-${item.time}`}
              className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-50/80 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-2xl p-2 ${
                    isIncome
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.time}</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-slate-950">{item.amount}</span>
            </div>
          );
        })
      )}
    </DashboardShellCard>
  );
}
