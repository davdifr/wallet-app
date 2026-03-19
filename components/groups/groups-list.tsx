"use client";

import Link from "next/link";
import { ArrowRight, ReceiptText, Scale } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GroupDetails } from "@/types/group-expenses";

type GroupsListProps = {
  groups: GroupDetails[];
};

export function GroupsList({ groups }: GroupsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-[1.75rem] tracking-tight text-foreground">
          I tuoi gruppi
        </CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          Gli spazi condivisi da controllare al volo, senza inseguire troppe metriche.
        </p>
      </CardHeader>

      <CardContent>
        {groups.length === 0 ? (
          <div className="rounded-[1.2rem] bg-secondary px-6 py-12 text-center">
            <h3 className="font-display text-xl font-semibold text-foreground">
              Nessun gruppo creato
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Crea il primo gruppo per iniziare a dividere spese e rimborsi.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {groups.map((item) => {
              const pendingSettlements = item.settlements.filter(
                (settlement) => settlement.status === "pending"
              ).length;
              const hasOpenBalances = item.summary.debts.length > 0 || pendingSettlements > 0;

              return (
                <Link
                  key={item.group.id}
                  href={`/groups/${item.group.id}`}
                  className="group rounded-[1.35rem] bg-secondary p-5 transition hover:bg-[hsl(var(--secondary)/0.92)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-display text-[1.25rem] font-semibold text-foreground">
                          {item.group.name}
                        </p>
                        {item.group.hasUnreadExpenses ? (
                          <span className="inline-flex shrink-0 items-center" title="Nuove spese">
                            <span className="sr-only">Nuove spese non viste</span>
                            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-[#FF92B1]" />
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {item.group.members.length} membri · {item.expenses.length} spese
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                          hasOpenBalances ? "bg-white/[0.06] text-slate-300" : "bg-[#7DF4C2]/12 text-[#D7FFF0]"
                        }`}
                      >
                        {hasOpenBalances ? "Da regolare" : "Pari"}
                      </span>
                      <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-background text-muted-foreground transition">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {item.group.description || "Apri il gruppo per vedere spese, saldi e rimborsi."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <div className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-2">
                      <Scale className="h-3.5 w-3.5" />
                      <span>{item.summary.debts.length} debiti aperti</span>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-2">
                      <ReceiptText className="h-3.5 w-3.5" />
                      <span>{pendingSettlements} rimborsi in attesa</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
