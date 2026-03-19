"use client";

import { ArrowRight, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { GroupBalanceSummary, Group as GroupType, Settlement, SharedExpense } from "@/types/group-expenses";

type GroupDirectoryItem = {
  group: GroupType;
  expenses: SharedExpense[];
  settlements: Settlement[];
  summary: GroupBalanceSummary;
};

type GroupDirectoryProps = {
  groups: GroupDirectoryItem[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}

export function GroupDirectory({
  groups,
  selectedGroupId,
  onSelectGroup
}: GroupDirectoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-2xl text-foreground">
          I tuoi gruppi
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Scegli un gruppo per vedere membri, spese e rimborsi nel contesto giusto.
        </p>
      </CardHeader>
      <CardContent>
        {groups.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-input px-6 py-12 text-center">
            <h3 className="font-display text-xl font-semibold text-foreground">
              Nessun gruppo creato
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Crea il primo gruppo per iniziare a dividere spese e rimborsi.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((item) => {
              const isActive = item.group.id === selectedGroupId;
              const openDebts = item.summary.debts.length;
              const positiveMembers = item.summary.balances.filter(
                (balance) => balance.netBalance > 0
              ).length;

              return (
                <button
                  key={item.group.id}
                  type="button"
                  onClick={() => onSelectGroup(item.group.id)}
                  className={cn(
                    "w-full rounded-3xl border p-4 text-left transition",
                    isActive
                      ? "border-input bg-muted text-foreground"
                      : "border-input bg-card text-foreground hover:bg-muted"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{item.group.name}</p>
                      <p
                        className={cn(
                          "mt-1 text-sm",
                          "text-muted-foreground"
                        )}
                      >
                        {item.group.description || "Nessuna descrizione"}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    <div
                      className={cn(
                        "rounded-2xl border px-3 py-2",
                        isActive
                          ? "border-input bg-background text-foreground"
                          : "border-input bg-background text-muted-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5" />
                        <span>{item.group.members.length} membri</span>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "rounded-2xl border px-3 py-2",
                        isActive
                          ? "border-input bg-background text-foreground"
                          : "border-input bg-background text-muted-foreground"
                      )}
                    >
                      {item.expenses.length} spese
                    </div>
                    <div
                      className={cn(
                        "rounded-2xl border px-3 py-2",
                        isActive
                          ? "border-input bg-background text-foreground"
                          : "border-input bg-background text-muted-foreground"
                      )}
                    >
                      {openDebts} debiti aperti
                    </div>
                    <div
                      className={cn(
                        "rounded-2xl border px-3 py-2",
                        isActive
                          ? "border-input bg-background text-foreground"
                          : "border-input bg-background text-muted-foreground"
                      )}
                    >
                      {positiveMembers > 0
                        ? `${positiveMembers} creditori`
                        : formatCurrency(0)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
