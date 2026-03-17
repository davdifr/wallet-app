import type {
  DebtEdge,
  GroupBalance,
  GroupBalanceSummary,
  GroupMember,
  Settlement,
  SharedExpense
} from "@/types/group-expenses";

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function distributeExpenseEqually(totalAmount: number, memberIds: string[]) {
  if (memberIds.length === 0) {
    return [];
  }

  const base = Math.floor((totalAmount / memberIds.length) * 100) / 100;
  const result = memberIds.map((memberId) => ({
    groupMemberId: memberId,
    amount: base
  }));
  const assigned = roundCurrency(base * memberIds.length);
  const remainder = roundCurrency(totalAmount - assigned);

  if (remainder > 0) {
    result[result.length - 1].amount = roundCurrency(
      result[result.length - 1].amount + remainder
    );
  }

  return result;
}

export function distributeExpenseByWeights(
  totalAmount: number,
  items: Array<{ groupMemberId: string; weight: number }>
) {
  const normalizedItems = items.filter((item) => item.weight > 0);

  if (normalizedItems.length === 0 || totalAmount <= 0) {
    return items.map((item) => ({
      groupMemberId: item.groupMemberId,
      amount: 0
    }));
  }

  const totalWeight = normalizedItems.reduce((sum, item) => sum + item.weight, 0);
  const allocated = normalizedItems.map((item) => ({
    groupMemberId: item.groupMemberId,
    amount: roundCurrency((totalAmount * item.weight) / totalWeight)
  }));
  const assigned = roundCurrency(allocated.reduce((sum, item) => sum + item.amount, 0));
  const remainder = roundCurrency(totalAmount - assigned);

  if (allocated.length > 0 && remainder !== 0) {
    allocated[allocated.length - 1].amount = roundCurrency(
      allocated[allocated.length - 1].amount + remainder
    );
  }

  return items.map((item) => ({
    groupMemberId: item.groupMemberId,
    amount:
      allocated.find((allocatedItem) => allocatedItem.groupMemberId === item.groupMemberId)
        ?.amount ?? 0
  }));
}

export function parseCustomSplitValues(value: string) {
  try {
    const parsed = JSON.parse(value) as Array<{
      groupMemberId: string;
      amount: number;
    }>;

    return parsed.filter(
      (item) =>
        typeof item.groupMemberId === "string" &&
        typeof item.amount === "number" &&
        item.amount >= 0
    );
  } catch {
    return [];
  }
}

export function calculateGroupBalanceSummary(
  members: GroupMember[],
  expenses: SharedExpense[],
  settlements: Settlement[]
): GroupBalanceSummary {
  const balanceMap = new Map<string, number>();

  for (const member of members) {
    balanceMap.set(member.id, 0);
  }

  for (const expense of expenses) {
    balanceMap.set(
      expense.paidByMemberId,
      roundCurrency((balanceMap.get(expense.paidByMemberId) ?? 0) + expense.amount)
    );

    for (const split of expense.splits) {
      balanceMap.set(
        split.groupMemberId,
        roundCurrency((balanceMap.get(split.groupMemberId) ?? 0) - split.amount)
      );
    }
  }

  for (const settlement of settlements) {
    if (settlement.status !== "completed") {
      continue;
    }

    balanceMap.set(
      settlement.payerMemberId,
      roundCurrency((balanceMap.get(settlement.payerMemberId) ?? 0) + settlement.amount)
    );
    balanceMap.set(
      settlement.payeeMemberId,
      roundCurrency((balanceMap.get(settlement.payeeMemberId) ?? 0) - settlement.amount)
    );
  }

  const balances: GroupBalance[] = members.map((member) => ({
    memberId: member.id,
    displayName: member.displayName,
    netBalance: roundCurrency(balanceMap.get(member.id) ?? 0)
  }));

  const creditors = balances
    .filter((item) => item.netBalance > 0.009)
    .map((item) => ({ ...item }));
  const debtors = balances
    .filter((item) => item.netBalance < -0.009)
    .map((item) => ({ ...item, netBalance: Math.abs(item.netBalance) }));

  const debts: DebtEdge[] = [];

  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];
    const amount = roundCurrency(Math.min(creditor.netBalance, debtor.netBalance));

    debts.push({
      fromMemberId: debtor.memberId,
      fromDisplayName: debtor.displayName,
      toMemberId: creditor.memberId,
      toDisplayName: creditor.displayName,
      amount
    });

    creditor.netBalance = roundCurrency(creditor.netBalance - amount);
    debtor.netBalance = roundCurrency(debtor.netBalance - amount);

    if (creditor.netBalance <= 0.009) {
      creditorIndex += 1;
    }

    if (debtor.netBalance <= 0.009) {
      debtorIndex += 1;
    }
  }

  return {
    balances,
    debts
  };
}
