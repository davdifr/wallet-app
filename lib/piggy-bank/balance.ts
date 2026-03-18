import type { PiggyBankMovementType } from "@/types/piggy-bank";

export type PiggyBankBalanceItem = {
  amount: number;
  movementType: PiggyBankMovementType;
};

const inflowMovementTypes: PiggyBankMovementType[] = [
  "manual_add",
  "auto_monthly_allocation"
];

export function calculatePiggyBankBalance(items: PiggyBankBalanceItem[]) {
  const balance = items.reduce((sum, item) => {
    if (inflowMovementTypes.includes(item.movementType)) {
      return sum + item.amount;
    }

    return sum - item.amount;
  }, 0);

  return Math.max(Math.round(balance * 100) / 100, 0);
}
