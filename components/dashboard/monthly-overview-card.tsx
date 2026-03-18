import { Wallet2 } from "lucide-react";

import { DashboardShellCard } from "@/components/dashboard/dashboard-shell-card";

type MonthlyOverviewCardProps = {
  balance: string;
  income: string;
  expenses: string;
  savingsRate: string;
  trend: number[];
};

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);

  return (
    <div className="flex h-28 items-end gap-2">
      {values.map((value, index) => (
        <div
          key={`${value}-${index}`}
          className="flex-1 rounded-t-[1rem] bg-gradient-to-t from-blue-600 via-cyan-500 to-emerald-300"
          style={{ height: `${Math.max((value / max) * 100, 18)}%` }}
        />
      ))}
    </div>
  );
}

export function MonthlyOverviewCard({
  balance,
  income,
  expenses,
  savingsRate,
  trend
}: MonthlyOverviewCardProps) {
  return (
    <DashboardShellCard
      title="Riepilogo Mese"
      subtitle="Visione rapida del mese in corso"
      className="overflow-hidden bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 text-white"
      contentClassName="space-y-4 sm:space-y-6"
    >
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:gap-5">
        <div className="space-y-4 sm:space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-200">
            <Wallet2 className="h-3.5 w-3.5" />
            Personal wallet
          </div>
          <div>
            <p className="text-sm text-slate-300">Saldo mese previsto</p>
            <p className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              {balance}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/8 p-3 sm:rounded-3xl sm:p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Entrate previste</p>
              <p className="mt-2 text-sm font-semibold sm:text-lg">{income}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-3 sm:rounded-3xl sm:p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Spese registrate</p>
              <p className="mt-2 text-sm font-semibold sm:text-lg">{expenses}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-3 sm:rounded-3xl sm:p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Risparmio</p>
              <p className="mt-2 text-sm font-semibold sm:text-lg">{savingsRate}</p>
            </div>
          </div>
        </div>

        <div className="hidden rounded-[2rem] border border-white/10 bg-white/8 p-5 lg:block">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-300">Andamento 7 giorni</p>
              <p className="mt-1 text-xs text-slate-400">Spesa netta giornaliera</p>
            </div>
            <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-300">
              stabile
            </span>
          </div>
          <div className="mt-6">
            <Sparkline values={trend} />
          </div>
        </div>
      </div>
    </DashboardShellCard>
  );
}
