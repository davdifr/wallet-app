import { AlertTriangle, CheckCircle2 } from "lucide-react";

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
    description: "Hai margine per chiudere il mese senza comprimere riserva e obiettivi.",
    className: "bg-[#7DF4C2]/12 text-[#D7FFF0]",
    icon: CheckCircle2
  },
  attenzione: {
    label: "Attenzione",
    description: "Il margine di oggi si e assottigliato e va gestito con un po' piu di disciplina.",
    className: "bg-[#FFD166]/12 text-[#FFE7A3]",
    icon: AlertTriangle
  },
  fuori_budget: {
    label: "Oltre margine",
    description: "Con il ritmo attuale il mese non copre piu le protezioni minime.",
    className: "bg-[#FF92B1]/12 text-[#FFD6E2]",
    icon: AlertTriangle
  }
} as const;

function buildNote(result: DailyBudgetResult) {
  if (result.warnings.negativeBudget) {
    return "Rientra nelle spese variabili per recuperare margine gia nei prossimi giorni.";
  }

  if (result.warnings.underfundedGoals) {
    return "Una parte dei goal sta perdendo copertura teorica rispetto al ritmo abituale.";
  }

  if (result.warnings.insufficientLiquidity) {
    return "Il denaro davvero spendibile e quasi esaurito fino a fine mese.";
  }

  return "Il margine di oggi tiene insieme spendibile, salvadanaio e protezione dei goal.";
}

export function DailyBudgetCard({ result, totalWealth }: DailyBudgetCardProps) {
  const status = statusCopy[result.status];
  const StatusIcon = status.icon;

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
          <p className="max-w-md text-sm leading-6 text-slate-400">{status.description}</p>
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
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[1.2rem] bg-white/[0.03] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Spendibile mese</p>
            <p className="mt-2 text-lg font-semibold tracking-tight text-white">
              {formatCurrency(result.remainingMonthlyBudget)}
            </p>
          </div>
          <div className="rounded-[1.2rem] bg-white/[0.03] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Salvadanaio</p>
            <p className="mt-2 text-lg font-semibold tracking-tight text-[#7DF4C2]">
              {formatCurrency(result.blockedInPiggyBank)}
            </p>
          </div>
          <div className="rounded-[1.2rem] bg-white/[0.03] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Riserva</p>
            <p className="mt-2 text-lg font-semibold tracking-tight text-slate-200">
              {formatCurrency(result.remainingMonthReserve)}
            </p>
          </div>
          <div className="rounded-[1.2rem] bg-white/[0.03] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Goal protetti</p>
            <p className="mt-2 text-lg font-semibold tracking-tight text-[#FF92B1]">
              {formatCurrency(result.protectedForGoals)}
            </p>
          </div>
        </div>

        <div className="rounded-[1.2rem] bg-[#0D1320] px-4 py-4">
          <p className="text-sm leading-6 text-slate-300">{buildNote(result)}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Patrimonio totale {totalWealth} · Restano {formatCurrency(result.remainingMonthlyBudget)} da distribuire fino a fine mese.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
