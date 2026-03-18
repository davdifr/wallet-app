import { AlertTriangle, CheckCircle2, WalletCards } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyBudgetResult } from "@/lib/budget/daily-budget";
import { cn } from "@/lib/utils";

type DailyBudgetCardProps = {
  result: DailyBudgetResult;
  totalWealth: string;
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
    description: "La liquidita residua copre mese, goal e denaro spendibile.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CheckCircle2
  },
  attenzione: {
    label: "Attenzione",
    description: "Il margine esiste, ma goal o riserva prudenziale sono sotto pressione.",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    icon: AlertTriangle
  },
  fuori_budget: {
    label: "Fuori budget",
    description: "La liquidita del mese non copre riserva e protezioni minime.",
    className: "border-rose-200 bg-rose-50 text-rose-700",
    icon: AlertTriangle
  }
} as const;

export function DailyBudgetCard({ result, totalWealth }: DailyBudgetCardProps) {
  const status = statusCopy[result.status];
  const StatusIcon = status.icon;
  const warnings = [
    result.warnings.negativeBudget ? "Budget mensile in tensione" : null,
    result.warnings.underfundedGoals ? "Goal sottofinanziati" : null,
    result.warnings.insufficientLiquidity ? "Liquidita insufficiente" : null
  ].filter(Boolean) as string[];

  return (
    <Card className="overflow-hidden border-white/70 bg-white/85 shadow-soft backdrop-blur">
      <CardHeader className="space-y-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-300">
              Puoi Spendere Oggi
            </p>
            <CardTitle className="font-display text-3xl text-white sm:text-4xl">
              {formatCurrency(result.dailyBudget)}
            </CardTitle>
            <p className="max-w-2xl text-sm text-slate-300">
              Il valore guida da usare oggi per arrivare a fine mese senza comprimere
              troppo salvadanaio, riserva prudenziale e obiettivi.
            </p>
          </div>
          <div className="rounded-full bg-white/10 p-2 text-white sm:self-start">
            <WalletCards className="h-5 w-5" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className={cn("rounded-2xl border px-4 py-3", status.className)}>
            <div className="flex items-center gap-2 text-sm font-medium">
              <StatusIcon className="h-4 w-4" />
              {status.label}
            </div>
            <p className="mt-1 text-sm">{status.description}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-100">
            {result.daysRemaining}{" "}
            {result.daysRemaining === 1 ? "giorno rimanente" : "giorni rimanenti"}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">Spendibile mese</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {formatCurrency(result.remainingMonthlyBudget)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">Salvadanaio</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {formatCurrency(result.blockedInPiggyBank)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">Riserva</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {formatCurrency(result.remainingMonthReserve)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">Goal</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {formatCurrency(result.protectedForGoals)}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Patrimonio</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{totalWealth}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Riserva prudenziale
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {formatCurrency(result.prudentialReserve)}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Preservati goal</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {formatCurrency(result.protectedForGoals)}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Giorni residui</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{result.daysRemaining}</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-slate-200 bg-slate-50/70 px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Formula sintetica
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{result.explanation}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50/70 px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Da tenere d&apos;occhio
            </p>
            {warnings.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">
                Nessun warning. Il margine di oggi e coerente con il piano di fine mese.
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {warnings.map((warning) => (
                  <span
                    key={warning}
                    className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
                  >
                    {warning}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
