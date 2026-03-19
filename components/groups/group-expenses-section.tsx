"use client";

import {
  CalendarDays,
  ChevronRight,
  Coins,
  CreditCard,
  Plus,
  ReceiptText,
  UserRound
} from "lucide-react";
import { useMemo, useState } from "react";

import { SettlementForm } from "@/components/groups/settlement-form";
import { SharedExpenseForm } from "@/components/groups/shared-expense-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import type {
  CreateSharedExpenseFormValues,
  GroupDetails,
  SharedExpense,
  GroupFormState,
  SettleSplitFormValues
} from "@/types/group-expenses";

type ExpenseFilter = "all" | "open" | "pending";
type ExpenseSort = "recent" | "amount-desc" | "amount-asc";

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

function getExpenseStats(group: GroupDetails, expense: SharedExpense) {
  const splitsExcludingPayer = expense.splits.filter(
    (split) => split.groupMemberId !== expense.paidByMemberId
  );
  const openSplits = splitsExcludingPayer.filter(
    (split) => Math.max(split.amount - split.settledAmount, 0) > 0
  );
  const pendingSettlements = group.settlements.filter(
    (settlement) =>
      settlement.sharedExpenseId === expense.id && settlement.status === "pending"
  );

  return {
    openSplitsCount: openSplits.length,
    pendingSettlementsCount: pendingSettlements.length
  };
}

function getExpenseStatusBadge(group: GroupDetails, expense: SharedExpense) {
  const { openSplitsCount, pendingSettlementsCount } = getExpenseStats(group, expense);

  if (pendingSettlementsCount > 0) {
    return {
      label: `${pendingSettlementsCount} rimborsi in attesa`,
      className: "border border-input bg-muted text-foreground"
    };
  }

  if (openSplitsCount > 0) {
    return {
      label: "Quote da regolare",
      className: "border border-input bg-muted text-foreground"
    };
  }

  return {
    label: "Tutto regolato",
    className: "border border-input bg-muted text-foreground"
  };
}

function compareExpenses(a: SharedExpense, b: SharedExpense, sort: ExpenseSort) {
  if (sort === "amount-desc") {
    return b.amount - a.amount;
  }

  if (sort === "amount-asc") {
    return a.amount - b.amount;
  }

  return new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime();
}

function ExpenseDetailContent({
  group,
  expense,
  pendingSettleSplitId,
  onSettleSplit
}: {
  group: GroupDetails;
  expense: SharedExpense;
  pendingSettleSplitId: string | null;
  onSettleSplit: (values: SettleSplitFormValues) => Promise<GroupFormState>;
}) {
  const { openSplitsCount, pendingSettlementsCount } = getExpenseStats(group, expense);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-input bg-card p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Importo</p>
          <p className="mt-2 font-display text-2xl font-semibold text-foreground">
            {formatCurrency(expense.amount)}
          </p>
        </div>
        <div className="rounded-2xl border border-input bg-card p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Pagata da</p>
          <p className="mt-2 text-sm font-medium text-foreground">
            {expense.paidByMember?.displayName ?? "Membro"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{expense.expenseDate}</p>
        </div>
        <div className="rounded-2xl border border-input bg-card p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Stato</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary">
              {openSplitsCount === 0 ? "Tutte le quote coperte" : `${openSplitsCount} quote aperte`}
            </Badge>
            {pendingSettlementsCount > 0 ? (
              <Badge className="border border-input bg-muted text-foreground">
                {pendingSettlementsCount} rimborsi in attesa
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      {expense.description ? (
        <div className="rounded-2xl border border-input bg-card px-4 py-3 text-sm text-muted-foreground">
          {expense.description}
        </div>
      ) : null}

      <div className="space-y-3">
        {expense.splits.map((split) => {
          const remainingAmount = Math.max(split.amount - split.settledAmount, 0);
          const pendingSplitSettlements = group.settlements.filter(
            (settlement) =>
              settlement.sharedExpenseSplitId === split.id && settlement.status === "pending"
          );

          return (
            <div
              key={split.id}
              className="grid gap-3 rounded-2xl border border-input bg-card p-4 lg:grid-cols-[minmax(0,1fr)_320px]"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground">
                    {split.member?.displayName ?? "Membro"}
                  </p>
                  {expense.paidByMemberId === split.groupMemberId ? (
                    <Badge variant="secondary">
                      Pagatore
                    </Badge>
                  ) : null}
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-xl border border-input bg-card px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Quota</p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {formatCurrency(split.amount)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-input bg-card px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Saldato</p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {formatCurrency(split.settledAmount)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-input bg-card px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Residuo</p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {formatCurrency(remainingAmount)}
                    </p>
                  </div>
                </div>

                {pendingSplitSettlements.length > 0 ? (
                  <div className="rounded-2xl border border-input bg-muted px-4 py-3 text-sm text-foreground">
                    {pendingSplitSettlements.map((settlement) => (
                      <p key={settlement.id}>
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
                      ? "rounded-2xl border border-input bg-muted px-4 py-3 text-sm text-foreground"
                      : "rounded-2xl border border-input bg-muted px-4 py-3 text-sm text-foreground"
                  }
                >
                  {expense.paidByMemberId === split.groupMemberId
                    ? "Questa quota appartiene al pagatore originale."
                    : pendingSplitSettlements.length > 0
                      ? "Rimborso in attesa di accettazione."
                      : "Quota gia saldata."}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
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
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ExpenseFilter>("all");
  const [sortBy, setSortBy] = useState<ExpenseSort>("recent");
  const selectedExpense = useMemo(
    () => group.expenses.find((expense) => expense.id === selectedExpenseId) ?? null,
    [group.expenses, selectedExpenseId]
  );
  const filteredExpenses = useMemo(() => {
    return [...group.expenses]
      .filter((expense) => {
        const { openSplitsCount, pendingSettlementsCount } = getExpenseStats(group, expense);

        if (activeFilter === "open") {
          return openSplitsCount > 0;
        }

        if (activeFilter === "pending") {
          return pendingSettlementsCount > 0;
        }

        return true;
      })
      .sort((a, b) => compareExpenses(a, b, sortBy));
  }, [activeFilter, group, sortBy]);
  const filterOptions: Array<{ key: ExpenseFilter; label: string }> = [
    { key: "all", label: "Tutte" },
    { key: "open", label: "Quote aperte" },
    { key: "pending", label: "Rimborsi in attesa" }
  ];

  async function handleCreateExpense(values: CreateSharedExpenseFormValues) {
    const result = await onCreateExpense(values);

    if (result.success) {
      setIsExpenseModalOpen(false);
    }

    return result;
  }

  return (
    <>
      <Card className="bg-card">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-input p-2 text-foreground">
                <ReceiptText className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="font-display text-2xl text-foreground">
                  Spese condivise
                </CardTitle>
                <p className="text-sm text-muted-foreground">
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
            <div className="rounded-3xl border border-dashed border-input px-6 py-10 text-center text-sm text-muted-foreground">
              Nessuna spesa ancora registrata per questo gruppo.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 rounded-3xl border border-input bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  {filterOptions.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setActiveFilter(option.key)}
                      className={
                        activeFilter === option.key
                          ? "rounded-full border border-input bg-muted px-3 py-2 text-xs font-medium text-foreground"
                          : "rounded-full border border-input bg-card px-3 py-2 text-xs font-medium text-foreground"
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ordina</p>
                  <div className="w-full sm:w-56">
                    <Select
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value as ExpenseSort)}
                    >
                      <option value="recent">Piu recenti</option>
                      <option value="amount-desc">Importo piu alto</option>
                      <option value="amount-asc">Importo piu basso</option>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <p className="text-sm text-muted-foreground">
                  {filteredExpenses.length === group.expenses.length
                    ? `${group.expenses.length} spese`
                    : `${filteredExpenses.length} su ${group.expenses.length} spese`}
                </p>
              </div>

              {filteredExpenses.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-input px-6 py-10 text-center text-sm text-muted-foreground">
                  Nessuna spesa corrisponde al filtro selezionato.
                </div>
              ) : null}

              {filteredExpenses.map((expense) => (
                <button
                  key={expense.id}
                  type="button"
                  onClick={() => setSelectedExpenseId(expense.id)}
                  className="w-full rounded-3xl border border-input bg-card p-5 text-left transition"
                >
                  {(() => {
                    const { openSplitsCount, pendingSettlementsCount } = getExpenseStats(
                      group,
                      expense
                    );
                    const statusBadge = getExpenseStatusBadge(group, expense);

                    return (
                      <>
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="truncate text-base font-semibold text-foreground sm:text-lg">
                                {expense.title}
                              </h3>
                              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                            </div>

                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground sm:text-sm">
                              <span className="inline-flex items-center gap-1">
                                <CalendarDays className="h-3.5 w-3.5" />
                                {expense.expenseDate}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <UserRound className="h-3.5 w-3.5" />
                                {expense.paidByMember?.displayName ?? "Membro"}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <CreditCard className="h-3.5 w-3.5" />
                                {expense.splitMethod === "equal"
                                  ? "Quote uguali"
                                  : "Quote personalizzate"}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="font-display text-2xl font-semibold text-foreground">
                              {formatCurrency(expense.amount)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Badge variant="secondary">
                            {openSplitsCount === 0
                              ? "Nessuna quota aperta"
                              : `${openSplitsCount} quote aperte`}
                          </Badge>
                          <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
                          <Badge variant="secondary">
                            {expense.splits.length} quote
                          </Badge>
                        </div>
                      </>
                    );
                  })()}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={selectedExpense !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedExpenseId(null);
          }
        }}
        title={selectedExpense?.title ?? "Dettaglio spesa"}
        description={
          selectedExpense
            ? "Qui trovi quote, rimborsi e stato reale della spesa selezionata."
            : undefined
        }
        className="max-w-5xl"
      >
        {selectedExpense ? (
          <ExpenseDetailContent
            group={group}
            expense={selectedExpense}
            pendingSettleSplitId={pendingSettleSplitId}
            onSettleSplit={onSettleSplit}
          />
        ) : null}
      </Modal>

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
