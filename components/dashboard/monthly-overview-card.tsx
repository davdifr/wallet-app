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
          className="flex-1 rounded-t-[1rem] border border-input bg-muted"
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
      className="overflow-hidden"
      contentClassName="space-y-4 sm:space-y-6"
    >
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:gap-5">
        <div className="space-y-4 sm:space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-input px-3 py-1 text-xs uppercase tracking-[0.24em] text-muted-foreground">
            <Wallet2 className="h-3.5 w-3.5" />
            Wallet personale
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <p className="text-sm text-muted-foreground">Puoi spendere oggi</p>
              <p className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                {spendableToday}
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-input px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Liquidita mese
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">{balance}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            <div className="rounded-2xl border border-input p-3 sm:rounded-3xl sm:p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Patrimonio</p>
              <p className="mt-2 text-sm font-semibold sm:text-lg">{totalWealth}</p>
            </div>
            <div className="rounded-2xl border border-input p-3 sm:rounded-3xl sm:p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Entrate</p>
              <p className="mt-2 text-sm font-semibold sm:text-lg">{income}</p>
            </div>
            <div className="rounded-2xl border border-input p-3 sm:rounded-3xl sm:p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Spese</p>
              <p className="mt-2 text-sm font-semibold sm:text-lg">{expenses}</p>
            </div>
            <div className="rounded-2xl border border-input p-3 sm:rounded-3xl sm:p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Nel salvadanaio
              </p>
              <p className="mt-2 text-sm font-semibold sm:text-lg">{savingsRate}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
            <div className="rounded-2xl border border-input p-3 sm:rounded-3xl sm:p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Riserva</p>
              <p className="mt-2 text-sm font-semibold sm:text-lg">{monthlyReserve}</p>
            </div>
            <div className="rounded-2xl border border-input p-3 sm:rounded-3xl sm:p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Goal protetti</p>
              <p className="mt-2 text-sm font-semibold sm:text-lg">{protectedGoals}</p>
            </div>
            <div className="rounded-2xl border border-input p-3 sm:rounded-3xl sm:p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Denaro spendibile
              </p>
              <p className="mt-2 text-sm font-semibold sm:text-lg">{balance}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-input p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              {spendableToday}
            </p>
            <span className="rounded-full border border-input px-3 py-1 text-xs font-medium text-muted-foreground">
              andamento
            </span>
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">Andamento 7 giorni</p>
            <p className="mt-1 text-xs text-muted-foreground">Spesa netta giornaliera</p>
          </div>
          <div className="mt-6">
            <Sparkline values={trend} />
          </div>
        </div>
      </div>
    </DashboardShellCard>
  );
}
