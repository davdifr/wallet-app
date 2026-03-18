import type { Database } from "@/types/database";

export type PiggyBankMovementType =
  Database["public"]["Enums"]["piggy_bank_movement_type"];

export type PiggyBankSettings = {
  id: string;
  autoMonthlyAmount: number;
  isAutoEnabled: boolean;
  startsOnMonth: string;
};

export type PiggyBankMovement = {
  id: string;
  movementType: PiggyBankMovementType;
  amount: number;
  movementDate: string;
  note: string;
  createdAt: string;
};

export type PiggyBankSummary = {
  balance: number;
  settings: PiggyBankSettings | null;
  recentMovements: PiggyBankMovement[];
};

export type PiggyBankSettingsFormValues = {
  autoMonthlyAmount: string;
  isAutoEnabled: boolean;
  startsOnMonth: string;
};

export type PiggyBankMovementFormValues = {
  amount: string;
  movementType: Extract<PiggyBankMovementType, "manual_add" | "manual_release">;
  note: string;
};
