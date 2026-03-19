import { ArrowRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GroupBalanceSummary } from "@/types/group-expenses";

type GroupSummaryProps = {
  summary: GroupBalanceSummary;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}

export function GroupSummary({ summary }: GroupSummaryProps) {
  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="font-display text-xl text-foreground">
          Chi deve a chi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          {summary.balances.map((balance) => (
            <div
              key={balance.memberId}
              className="rounded-2xl border border-input bg-card px-4 py-3"
            >
              <p className="text-sm font-medium text-foreground">{balance.displayName}</p>
              <p
                className={
                  balance.netBalance >= 0
                    ? "mt-2 text-lg font-semibold text-foreground"
                    : "mt-2 text-lg font-semibold text-foreground"
                }
              >
                {formatCurrency(balance.netBalance)}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {summary.debts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-input px-4 py-6 text-center text-sm text-muted-foreground">
              Nessun debito aperto: il gruppo e in equilibrio.
            </div>
          ) : (
            summary.debts.map((debt, index) => (
              <div
                key={`${debt.fromMemberId}-${debt.toMemberId}-${index}`}
                className="flex items-center justify-between rounded-2xl border border-input bg-card px-4 py-3 text-sm"
              >
                <div className="flex items-center gap-2 text-foreground">
                  <span>{debt.fromDisplayName}</span>
                  <ArrowRight className="h-4 w-4" />
                  <span>{debt.toDisplayName}</span>
                </div>
                <span className="font-semibold text-foreground">
                  {formatCurrency(debt.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
