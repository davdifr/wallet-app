import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyBudgetResult } from "@/lib/budget/daily-budget";
import { cn } from "@/lib/utils";

type DailyBudgetCardProps = {
  result: DailyBudgetResult;
  totalWealth: string;
  incomeLabel: string;
  expensesLabel: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}

const statusCopy = {
  in_linea: {
    label: "In linea",
    className: "bg-[#7DF4C2]/12 text-[#D7FFF0]",
    icon: CheckCircle2
  },
  attenzione: {
    label: "Attenzione",
    className: "bg-[#FFD166]/12 text-[#FFE7A3]",
    icon: AlertTriangle
  },
  fuori_budget: {
    label: "Oltre margine",
    className: "bg-[#FF92B1]/12 text-[#FFD6E2]",
    icon: AlertTriangle
  }
} as const;

export function DailyBudgetCard({
  result,
  totalWealth,
  incomeLabel,
  expensesLabel
}: DailyBudgetCardProps) {
  const status = statusCopy[result.status];
  const StatusIcon = status.icon;
  const protectedBalance = result.blockedInPiggyBank + result.protectedForGoals;
  const monthProgress = Math.min(
    100,
    Math.max(0, (result.daysElapsed / Math.max(result.daysInMonth, 1)) * 100)
  );
  const summaryItems = [
    { label: "Totale", value: totalWealth, tone: "text-white" },
    {
      label: "Disponibile",
      value: formatCurrency(result.remainingMonthlyBudget),
      tone: "text-[#55C7FF]"
    },
    {
      label: "Protetto",
      value: formatCurrency(protectedBalance),
      tone: "text-[#7DF4C2]"
    }
  ] as const;

  return (
    <Card className="overflow-hidden rounded-[1.9rem] border border-white/6 bg-[#101725] text-white shadow-[0_18px_42px_rgba(0,0,0,0.24)]">
      <CardHeader className="space-y-5 px-5 pb-5 pt-5 sm:px-6 sm:pt-6">
        <div className="space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">
            Puoi spendere oggi
          </p>
          <CardTitle className="max-w-[11ch] font-display text-[3rem] leading-[0.92] tracking-[-0.055em] text-white sm:text-[3.7rem]">
            {formatCurrency(result.dailyBudget)}
          </CardTitle>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className={cn("inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium", status.className)}>
            <StatusIcon className="h-4 w-4" />
            {status.label}
          </div>
          <div className="text-sm text-slate-400">
            {result.daysRemaining} {result.daysRemaining === 1 ? "giorno per chiudere il mese" : "giorni per chiudere il mese"}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-5 pb-5 sm:px-6 sm:pb-6">
        <div className="grid grid-cols-3 gap-2">
          {summaryItems.map((item) => (
            <div key={item.label} className="rounded-[1.1rem] bg-white/[0.03] px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
              <p className={cn("mt-2 text-[0.98rem] font-semibold tracking-tight", item.tone)}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-[1.2rem] bg-[#0D1320] px-4 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Mese in corso</p>
            <p className="mt-1 text-sm text-slate-300">
              Giorno {result.daysElapsed} di {result.daysInMonth}
            </p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-[#55C7FF] transition-all"
              style={{ width: `${monthProgress}%` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-[1rem] bg-white/[0.03] px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Entrate</p>
              <p className="mt-2 text-[0.98rem] font-semibold tracking-tight text-white">
                {incomeLabel}
              </p>
            </div>
            <div className="rounded-[1rem] bg-white/[0.03] px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Spese</p>
              <p className="mt-2 text-[0.98rem] font-semibold tracking-tight text-white">
                {expensesLabel}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
