export type SpendingPaceTransaction = {
  amount: number;
  transactionDate: string;
  transactionType: "income" | "expense";
};

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function getMonthStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function getTrailingThreeMonthStarts(currentDate: Date) {
  const currentMonthStart = getMonthStart(currentDate);
  const lastClosedMonthStart = new Date(
    Date.UTC(
      currentMonthStart.getUTCFullYear(),
      currentMonthStart.getUTCMonth() - 1,
      1
    )
  );

  return [2, 1, 0].map((offset) =>
    new Date(
      Date.UTC(
        lastClosedMonthStart.getUTCFullYear(),
        lastClosedMonthStart.getUTCMonth() - offset,
        1
      )
    )
  );
}

export function calculateAverageMonthlyExpensesLastThreeMonths(
  transactions: SpendingPaceTransaction[],
  currentDate: Date
) {
  const monthStarts = getTrailingThreeMonthStarts(currentDate);
  const totals = new Map<string, number>(
    monthStarts.map((monthStart) => [toIsoDate(monthStart), 0])
  );

  for (const transaction of transactions) {
    if (transaction.transactionType !== "expense") {
      continue;
    }

    const monthStartKey = `${transaction.transactionDate.slice(0, 7)}-01`;

    if (!totals.has(monthStartKey)) {
      continue;
    }

    totals.set(monthStartKey, (totals.get(monthStartKey) ?? 0) + transaction.amount);
  }

  const values = Array.from(totals.values());
  const average =
    values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

  return roundCurrency(average);
}
