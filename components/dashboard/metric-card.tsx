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
  neutral: "border border-input text-muted-foreground",
  positive: "border border-input text-muted-foreground",
  warning: "border border-input text-muted-foreground"
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
      <p className="font-display text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
    </DashboardShellCard>
  );
}
