import { PiggyBank, TrendingDown, TrendingUp, WalletCards } from "lucide-react";

import { DashboardShellCard } from "@/components/dashboard/dashboard-shell-card";

type MonthlyBreakdownCardProps = {
  balance: string;
  expenses: string;
  incomes: string;
  savingsTarget: string;
};

const items = [
  { key: "balance", label: "Saldo mese", icon: WalletCards, tone: "neutral" },
  { key: "expenses", label: "Spese mese", icon: TrendingDown, tone: "warning" },
  { key: "incomes", label: "Entrate mese", icon: TrendingUp, tone: "positive" },
  { key: "savingsTarget", label: "Target risparmio", icon: PiggyBank, tone: "neutral" }
] as const;

const toneClassName = {
  neutral: "bg-slate-100 text-slate-700",
  positive: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700"
} as const;

export function MonthlyBreakdownCard({
  balance,
  expenses,
  incomes,
  savingsTarget
}: MonthlyBreakdownCardProps) {
  const valueMap = {
    balance,
    expenses,
    incomes,
    savingsTarget
  };

  return (
    <DashboardShellCard
      title="KPI Principali"
      subtitle="I numeri che contano oggi"
      contentClassName="grid gap-3 sm:grid-cols-2"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.key} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-slate-950">
                  {valueMap[item.key]}
                </p>
              </div>
              <div className={`rounded-2xl p-2 ${toneClassName[item.tone]}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
          </div>
        );
      })}
    </DashboardShellCard>
  );
}
