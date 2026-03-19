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
      title="Ultimi movimenti"
      subtitle="Le variazioni che meritano uno sguardo rapido"
      contentClassName="space-y-3"
    >
      {items.length === 0 ? (
        <div className="rounded-[1.2rem] bg-white/[0.03] px-5 py-8 text-center text-sm text-slate-400">
          Nessun movimento recente disponibile.
        </div>
      ) : (
        items.map((item) => {
          const isIncome = item.type === "income";
          const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;

          return (
            <div
              key={`${item.label}-${item.time}`}
              className="flex items-center justify-between gap-3 rounded-[1.2rem] bg-white/[0.03] px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-[#0D1320] text-slate-200"
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-white">{item.label}</p>
                  <p className="text-sm text-slate-400">{item.time}</p>
                </div>
              </div>
              <span
                className={`text-[15px] font-semibold tracking-tight ${
                  isIncome ? "text-[#7DF4C2]" : "text-[#FF92B1]"
                }`}
              >
                {item.amount}
              </span>
            </div>
          );
        })
      )}
    </DashboardShellCard>
  );
}
