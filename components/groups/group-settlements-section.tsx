"use client";

import { Coins } from "lucide-react";

import { AcceptSettlementForm } from "@/components/groups/accept-settlement-form";
import { GroupSummary } from "@/components/groups/group-summary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GroupDetails, GroupFormState } from "@/types/group-expenses";

type GroupSettlementsSectionProps = {
  currentUserId: string | null;
  group: GroupDetails;
  pendingAcceptSettlementId?: string | null;
  onAcceptSettlement: (settlementId: string) => Promise<GroupFormState>;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}

export function GroupSettlementsSection({
  currentUserId,
  group,
  pendingAcceptSettlementId = null,
  onAcceptSettlement
}: GroupSettlementsSectionProps) {
  const pendingSettlements = group.settlements.filter(
    (settlement) => settlement.status === "pending"
  );

  return (
    <div className="space-y-6">
      <GroupSummary summary={group.summary} />

      <Card className="border-white/70 bg-white/85 shadow-soft backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-950 p-2 text-white">
              <Coins className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="font-display text-2xl text-slate-950">
                Rimborsi
              </CardTitle>
              <p className="text-sm text-slate-500">
                Qui vedi i rimborsi in attesa e lo stato dei saldi del gruppo.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {pendingSettlements.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-10 text-center text-sm text-slate-500">
              Nessun rimborso in attesa per questo gruppo.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingSettlements.map((settlement) => {
                const payer = group.group.members.find(
                  (member) => member.id === settlement.payerMemberId
                );
                const payee = group.group.members.find(
                  (member) => member.id === settlement.payeeMemberId
                );
                const canAccept =
                  currentUserId !== null &&
                  (currentUserId === settlement.payerUserId ||
                    currentUserId === settlement.payeeUserId);

                return (
                  <div
                    key={settlement.id}
                    className="grid gap-3 rounded-3xl border border-amber-200 bg-amber-50/70 p-4 lg:grid-cols-[1fr_auto]"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-slate-950">
                        {payer?.displayName ?? "Membro"} deve a{" "}
                        {payee?.displayName ?? "Membro"}
                      </p>
                      <p className="text-sm text-slate-600">
                        {formatCurrency(settlement.amount)} · {settlement.settlementDate}
                      </p>
                      {settlement.note ? (
                        <p className="text-xs text-slate-500">{settlement.note}</p>
                      ) : null}
                    </div>

                    {canAccept ? (
                      <AcceptSettlementForm
                        settlementId={settlement.id}
                        isSubmitting={pendingAcceptSettlementId === settlement.id}
                        onSubmit={onAcceptSettlement}
                      />
                    ) : (
                      <div className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-amber-800">
                        In attesa di conferma da parte di uno degli utenti coinvolti
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
