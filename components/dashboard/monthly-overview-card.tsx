import { Wallet2 } from "lucide-react";

import { DashboardShellCard } from "@/components/dashboard/dashboard-shell-card";

type MonthlyOverviewCardProps = {
  totalWealth: string;
  balance: string;
  spendableToday: string;
  income: string;
  expenses: string;
  savingsRate: string;
  monthlyReserve: string;
  protectedGoals: string;
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
  totalWealth,
  balance,
  spendableToday,
  income,
  expenses,
  savingsRate,
  monthlyReserve,
  protectedGoals,
  trend
}: MonthlyOverviewCardProps) {
  return (
    <DashboardShellCard
      title="Riepilogo Mese"
      subtitle="Solo i driver utili per leggere il margine di oggi"
      className="overflow-hidden bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 text-white"
      contentClassName="space-y-4 sm:space-y-6"
    >
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:gap-5">
        <div className="space-y-4 sm:space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-200">
            <Wallet2 className="h-3.5 w-3.5" />
            Wallet personale
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <p className="text-sm text-slate-300">Puoi spendere oggi</p>
              <p className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                {spendableToday}
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-white/8 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                Liquidita mese
              </p>
              <p className="mt-2 text-lg font-semibold text-white">{balance}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/8 p-3 sm:rounded-3xl sm:p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Patrimonio</p>
              <p className="mt-2 text-sm font-semibold sm:text-lg">{totalWealth}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-3 sm:rounded-3xl sm:p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Entrate</p>
              <p className="mt-2 text-sm font-semibold sm:text-lg">{income}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-3 sm:rounded-3xl sm:p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Spese</p>
              <p className="mt-2 text-sm font-semibold sm:text-lg">{expenses}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-3 sm:rounded-3xl sm:p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                Nel salvadanaio
              </p>
              <p className="mt-2 text-sm font-semibold sm:text-lg">{savingsRate}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/8 p-3 sm:rounded-3xl sm:p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Riserva</p>
              <p className="mt-2 text-sm font-semibold sm:text-lg">{monthlyReserve}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-3 sm:rounded-3xl sm:p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Goal protetti</p>
              <p className="mt-2 text-sm font-semibold sm:text-lg">{protectedGoals}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-3 sm:rounded-3xl sm:p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                Denaro spendibile
              </p>
              <p className="mt-2 text-sm font-semibold sm:text-lg">{balance}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/8 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              {spendableToday}
            </p>
            <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-300">
              andamento
            </span>
          </div>
          <div className="mt-4">
            <p className="text-sm text-slate-300">Andamento 7 giorni</p>
            <p className="mt-1 text-xs text-slate-400">Spesa netta giornaliera</p>
          </div>
          <div className="mt-6">
            <Sparkline values={trend} />
          </div>
        </div>
      </div>
    </DashboardShellCard>
  );
}
