import type { LucideIcon } from "lucide-react";

import { DashboardShellCard } from "@/components/dashboard/dashboard-shell-card";

type MetricCardProps = {
  title: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone?: "neutral" | "positive" | "warning";
};

const toneClassName = {
  neutral: "bg-slate-100 text-slate-700",
  positive: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700"
} as const;

export function MetricCard({
  title,
  value,
  helper,
  icon: Icon,
  tone = "neutral"
}: MetricCardProps) {
  return (
    <DashboardShellCard
      title={title}
      action={
        <div className={`rounded-2xl p-2 ${toneClassName[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      }
      contentClassName="pt-1"
    >
      <p className="font-display text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </DashboardShellCard>
  );
}
