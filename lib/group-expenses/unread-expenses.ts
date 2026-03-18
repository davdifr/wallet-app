type ExpenseActivity = {
  createdAt: string;
  createdByUserId: string | null;
};

export function getLatestRelevantSharedExpenseAt(
  expenses: ExpenseActivity[],
  currentUserId: string | null
) {
  const relevantExpenses = expenses.filter(
    (expense) => expense.createdByUserId === null || expense.createdByUserId !== currentUserId
  );

  if (relevantExpenses.length === 0) {
    return null;
  }

  return relevantExpenses.reduce((latest, expense) =>
    latest === null || expense.createdAt > latest ? expense.createdAt : latest
  , null as string | null);
}

export function calculateHasUnreadSharedExpenses(input: {
  expenses: ExpenseActivity[];
  currentUserId: string | null;
  lastViewedAt: string | null;
  joinedAt: string | null;
}) {
  const latestRelevantExpenseAt = getLatestRelevantSharedExpenseAt(
    input.expenses,
    input.currentUserId
  );

  if (!latestRelevantExpenseAt) {
    return false;
  }

  // Alla prima visualizzazione usiamo joinedAt come baseline:
  // le spese anteriori all'ingresso nel gruppo non vengono trattate come nuove.
  const baselineViewedAt = input.lastViewedAt ?? input.joinedAt;

  if (!baselineViewedAt) {
    return true;
  }

  return latestRelevantExpenseAt > baselineViewedAt;
}
