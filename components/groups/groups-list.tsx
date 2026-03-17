import { AcceptSettlementForm } from "@/components/groups/accept-settlement-form";
import { GroupMemberForm } from "@/components/groups/group-member-form";
import { GroupSummary } from "@/components/groups/group-summary";
import { SettlementForm } from "@/components/groups/settlement-form";
import { SharedExpenseForm } from "@/components/groups/shared-expense-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  AddGroupMemberFormValues,
  CreateSharedExpenseFormValues,
  GroupBalanceSummary,
  Group as GroupType,
  Settlement,
  SettleSplitFormValues,
  SharedExpense,
  UserInviteCandidate
} from "@/types/group-expenses";

type GroupsListProps = {
  groups: Array<{
    group: GroupType;
    expenses: SharedExpense[];
    settlements: Settlement[];
    summary: GroupBalanceSummary;
  }>;
  inviteCandidates: UserInviteCandidate[];
  currentUserId: string | null;
  pendingAcceptSettlementId?: string | null;
  pendingAddMemberGroupId?: string | null;
  pendingCreateExpenseGroupId?: string | null;
  pendingSettleSplitId?: string | null;
  onAcceptSettlement: (settlementId: string) => Promise<{ success: boolean; message?: string }>;
  onAddMember: (
    values: AddGroupMemberFormValues
  ) => Promise<{ success: boolean; message?: string; errors?: Record<string, string[] | undefined> }>;
  onCreateExpense: (
    values: CreateSharedExpenseFormValues
  ) => Promise<{ success: boolean; message?: string; errors?: Record<string, string[] | undefined> }>;
  onSettleSplit: (
    values: SettleSplitFormValues
  ) => Promise<{ success: boolean; message?: string; errors?: Record<string, string[] | undefined> }>;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}

export function GroupsList({
  groups,
  inviteCandidates,
  currentUserId,
  pendingAcceptSettlementId = null,
  pendingAddMemberGroupId = null,
  pendingCreateExpenseGroupId = null,
  pendingSettleSplitId = null,
  onAcceptSettlement,
  onAddMember,
  onCreateExpense,
  onSettleSplit
}: GroupsListProps) {
  if (groups.length === 0) {
    return (
      <Card className="border-white/70 bg-white/85 shadow-soft backdrop-blur">
        <CardContent className="px-6 py-12 text-center">
          <h3 className="font-display text-xl font-semibold text-slate-950">
            Nessun gruppo creato
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Crea il primo gruppo per dividere spese, quote personalizzate e rimborsi.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map(({ group, expenses, settlements, summary }) => (
        <Card key={group.id} className="border-white/70 bg-white/85 shadow-soft backdrop-blur">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="font-display text-2xl text-slate-950">
                  {group.name}
                </CardTitle>
                <p className="mt-1 text-sm text-slate-500">{group.description}</p>
              </div>
              <Badge variant="secondary" className="w-fit bg-white text-slate-700">
                {group.members.length} membri
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              {group.members.map((member) => (
                <span
                  key={member.id}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600"
                >
                  {member.displayName}
                  {member.isGuest ? " · guest" : ""}
                </span>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <GroupSummary summary={summary} />
            <GroupMemberForm
              groupId={group.id}
              inviteCandidates={inviteCandidates.filter(
                (candidate) =>
                  !group.members.some((member) => member.userId === candidate.id)
              )}
              isSubmitting={pendingAddMemberGroupId === group.id}
              onSubmit={onAddMember}
            />
            <SharedExpenseForm
              groupId={group.id}
              members={group.members}
              isSubmitting={pendingCreateExpenseGroupId === group.id}
              onSubmit={onCreateExpense}
            />

            {settlements.some((settlement) => settlement.status === "pending") ? (
              <div className="space-y-3 rounded-3xl border border-amber-200 bg-amber-50/70 p-5">
                <div>
                  <h4 className="font-display text-xl font-semibold text-slate-950">
                    Rimborsi in attesa
                  </h4>
                  <p className="mt-1 text-sm text-slate-600">
                    I rimborsi segnati da terzi restano fuori dai resoconti globali finche
                    uno degli utenti coinvolti non li accetta.
                  </p>
                </div>

                <div className="grid gap-3">
                  {settlements
                    .filter((settlement) => settlement.status === "pending")
                    .map((settlement) => {
                      const payer = group.members.find(
                        (member) => member.id === settlement.payerMemberId
                      );
                      const payee = group.members.find(
                        (member) => member.id === settlement.payeeMemberId
                      );
                      const canAccept =
                        currentUserId !== null &&
                        (currentUserId === settlement.payerUserId ||
                          currentUserId === settlement.payeeUserId);

                      return (
                        <div
                          key={settlement.id}
                          className="grid gap-3 rounded-2xl border border-amber-200 bg-white/90 p-4 lg:grid-cols-[1fr_auto]"
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-slate-900">
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
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                              In attesa di conferma da parte di uno degli utenti coinvolti
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : null}

            <div className="space-y-4">
              <h4 className="font-display text-xl font-semibold text-slate-950">
                Spese condivise
              </h4>
              {expenses.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-10 text-center text-sm text-slate-500">
                  Nessuna spesa ancora registrata per questo gruppo.
                </div>
              ) : (
                expenses.map((expense) => (
                  <article
                    key={expense.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h5 className="text-lg font-semibold text-slate-950">{expense.title}</h5>
                        <p className="mt-1 text-sm text-slate-500">
                          {expense.description} · pagata da{" "}
                          {expense.paidByMember?.displayName ?? "Membro"} · {expense.expenseDate}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-2xl font-semibold text-slate-950">
                          {formatCurrency(expense.amount)}
                        </p>
                        <p className="text-xs text-slate-500">{expense.splitMethod}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3">
                      {expense.splits.map((split) => {
                        const remainingAmount = Math.max(
                          split.amount - split.settledAmount,
                          0
                        );
                        const pendingSplitSettlements = settlements.filter(
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
                                groupId={group.id}
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
                ))
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
