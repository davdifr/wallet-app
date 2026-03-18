"use client";

import { Plus, ReceiptText } from "lucide-react";
import { useState } from "react";

import { SettlementForm } from "@/components/groups/settlement-form";
import { SharedExpenseForm } from "@/components/groups/shared-expense-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import type {
  CreateSharedExpenseFormValues,
  GroupDetails,
  GroupFormState,
  SettleSplitFormValues
} from "@/types/group-expenses";

type GroupExpensesSectionProps = {
  currentUserId: string | null;
  group: GroupDetails;
  pendingCreateExpenseGroupId?: string | null;
  pendingSettleSplitId?: string | null;
  onCreateExpense: (values: CreateSharedExpenseFormValues) => Promise<GroupFormState>;
  onSettleSplit: (values: SettleSplitFormValues) => Promise<GroupFormState>;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}

export function GroupExpensesSection({
  currentUserId,
  group,
  pendingCreateExpenseGroupId = null,
  pendingSettleSplitId = null,
  onCreateExpense,
  onSettleSplit
}: GroupExpensesSectionProps) {
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  async function handleCreateExpense(values: CreateSharedExpenseFormValues) {
    const result = await onCreateExpense(values);

    if (result.success) {
      setIsExpenseModalOpen(false);
    }

    return result;
  }

  return (
    <>
      <Card className="border-white/70 bg-white/85 shadow-soft backdrop-blur">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-950 p-2 text-white">
                <ReceiptText className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="font-display text-2xl text-slate-950">
                  Spese condivise
                </CardTitle>
                <p className="text-sm text-slate-500">
                  Registra una spesa e poi gestisci i rimborsi quota per quota.
                </p>
              </div>
            </div>

            <Button type="button" onClick={() => setIsExpenseModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Aggiungi spesa
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {group.expenses.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-10 text-center text-sm text-slate-500">
              Nessuna spesa ancora registrata per questo gruppo.
            </div>
          ) : (
            <div className="space-y-4">
              {group.expenses.map((expense) => (
                <article
                  key={expense.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">{expense.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {expense.description || "Nessuna descrizione"} · pagata da{" "}
                        {expense.paidByMember?.displayName ?? "Membro"} · {expense.expenseDate}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="font-display text-2xl font-semibold text-slate-950">
                        {formatCurrency(expense.amount)}
                      </p>
                      <p className="text-xs text-slate-500">{expense.splitMethod}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3">
                    {expense.splits.map((split) => {
                      const remainingAmount = Math.max(split.amount - split.settledAmount, 0);
                      const pendingSplitSettlements = group.settlements.filter(
                        (settlement) =>
                          settlement.sharedExpenseSplitId === split.id &&
                          settlement.status === "pending"
                      );

                      return (
                        <div
                          key={split.id}
                          className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 lg:grid-cols-[1fr_auto]"
                        >
                          <div>
                            <p className="font-medium text-slate-900">
                              {split.member?.displayName ?? "Membro"}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Quota {formatCurrency(split.amount)} · saldato{" "}
                              {formatCurrency(split.settledAmount)} · residuo{" "}
                              {formatCurrency(remainingAmount)}
                            </p>
                            {pendingSplitSettlements.length > 0 ? (
                              <div className="mt-2 space-y-1">
                                {pendingSplitSettlements.map((settlement) => (
                                  <p
                                    key={settlement.id}
                                    className="text-xs font-medium text-amber-700"
                                  >
                                    Rimborso in attesa: {formatCurrency(settlement.amount)}
                                  </p>
                                ))}
                              </div>
                            ) : null}
                          </div>

                          {remainingAmount > 0 &&
                          expense.paidByMemberId !== split.groupMemberId &&
                          pendingSplitSettlements.length === 0 ? (
                            <SettlementForm
                              groupId={group.group.id}
                              expenseId={expense.id}
                              splitId={split.id}
                              payerMemberId={split.groupMemberId}
                              payeeMemberId={expense.paidByMemberId}
                              remainingAmount={remainingAmount}
                              isSubmitting={pendingSettleSplitId === split.id}
                              onSubmit={onSettleSplit}
                            />
                          ) : (
                            <div
                              className={
                                pendingSplitSettlements.length > 0
                                  ? "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
                                  : "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                              }
                            >
                              {expense.paidByMemberId === split.groupMemberId
                                ? "Pagatore originale"
                                : pendingSplitSettlements.length > 0
                                  ? "Rimborso in attesa di accettazione"
                                  : "Quota saldata"}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={isExpenseModalOpen}
        onOpenChange={setIsExpenseModalOpen}
        title="Nuova spesa condivisa"
        description="Registra una spesa del gruppo e distribuisci le quote tra i partecipanti."
        className="max-w-4xl"
      >
        <SharedExpenseForm
          currentUserId={currentUserId}
          groupId={group.group.id}
          members={group.group.members}
          isSubmitting={pendingCreateExpenseGroupId === group.group.id}
          onSubmit={handleCreateExpense}
        />
      </Modal>
    </>
  );
}
