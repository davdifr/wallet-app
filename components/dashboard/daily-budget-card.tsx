import { AlertTriangle, CheckCircle2, WalletCards } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateDailyBudget, type DailyBudgetInput } from "@/lib/budget/daily-budget";
import { cn } from "@/lib/utils";

type DailyBudgetCardProps = {
  input: DailyBudgetInput;
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
    description: "Il ritmo di spesa e coerente con il piano mensile.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CheckCircle2
  },
  attenzione: {
    label: "Attenzione",
    description: "Stai consumando il margine piu velocemente del previsto.",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    icon: AlertTriangle
  },
  fuori_budget: {
    label: "Fuori budget",
    description: "Il residuo mensile e negativo o il target non e sostenibile.",
    className: "border-rose-200 bg-rose-50 text-rose-700",
    icon: AlertTriangle
  }
} as const;

export function DailyBudgetCard({ input }: DailyBudgetCardProps) {
  const result = calculateDailyBudget(input);
  const status = statusCopy[result.status];
  const StatusIcon = status.icon;

  return (
    <Card className="border-white/70 bg-white/85 shadow-soft backdrop-blur">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
              Budget Giornaliero
            </p>
            <CardTitle className="font-display text-2xl text-slate-950">
              Quanto puoi spendere da oggi a fine mese
            </CardTitle>
          </div>
          <div className="rounded-full bg-slate-100 p-2 text-primary">
            <WalletCards className="h-5 w-5" />
          </div>
        </div>

        <div className={cn("rounded-2xl border px-4 py-3", status.className)}>
          <div className="flex items-center gap-2 text-sm font-medium">
            <StatusIcon className="h-4 w-4" />
            {status.label}
          </div>
          <p className="mt-1 text-sm">{status.description}</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white">
            <p className="text-sm text-slate-300">Budget residuo del mese</p>
            <p className="mt-3 font-display text-4xl font-semibold">
              {formatCurrency(result.remainingMonthlyBudget)}
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Entrate previste - spese registrate - target risparmio
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Spesa giornaliera consigliata</p>
            <p className="mt-3 font-display text-4xl font-semibold text-slate-950">
              {formatCurrency(result.recommendedDailySpend)}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Residuo diviso per {result.daysRemaining}{" "}
              {result.daysRemaining === 1 ? "giorno" : "giorni"} rimanenti
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Spendibile Mese
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {formatCurrency(result.spendableBudget)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Ritmo Ideale
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {formatCurrency(result.idealDailySpend)}/giorno
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Scostamento
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {formatCurrency(result.varianceToDate)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
