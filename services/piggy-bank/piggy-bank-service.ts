import { calculatePiggyBankBalance } from "@/lib/piggy-bank/balance";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type {
  PiggyBankMovement,
  PiggyBankMovementFormValues,
  PiggyBankSettings,
  PiggyBankSettingsFormValues,
  PiggyBankSummary
} from "@/types/piggy-bank";

type PiggyBankSettingsRow =
  Database["public"]["Tables"]["piggy_bank_settings"]["Row"];
type PiggyBankSettingsInsert =
  Database["public"]["Tables"]["piggy_bank_settings"]["Insert"];
type PiggyBankMovementRow =
  Database["public"]["Tables"]["piggy_bank_movements"]["Row"];
type PiggyBankMovementInsert =
  Database["public"]["Tables"]["piggy_bank_movements"]["Insert"];

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function normalizeMonthStart(value: string) {
  return `${value.slice(0, 7)}-01`;
}

function getMonthStart(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));
}

function addMonths(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function mapSettings(row: PiggyBankSettingsRow): PiggyBankSettings {
  return {
    id: row.id,
    autoMonthlyAmount: row.auto_monthly_amount,
    isAutoEnabled: row.is_auto_enabled,
    startsOnMonth: row.starts_on_month
  };
}

function mapMovement(row: PiggyBankMovementRow): PiggyBankMovement {
  return {
    id: row.id,
    movementType: row.movement_type,
    amount: row.amount,
    movementDate: row.movement_date,
    note: row.note ?? "",
    createdAt: row.created_at
  };
}

export async function materializePiggyBankAutoAllocations(
  currentDate = new Date()
) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("piggy_bank_settings")
    .select("*")
    .eq("is_auto_enabled", true)
    .gt("auto_monthly_amount", 0);

  if (error) {
    throw new Error(error.message);
  }

  const settingsRows = (data ?? []) as PiggyBankSettingsRow[];

  for (const settings of settingsRows) {
    const startMonth = getMonthStart(
      new Date(`${settings.starts_on_month}T00:00:00.000Z`)
    );
    const currentMonth = getMonthStart(currentDate);
    const inserts: PiggyBankMovementInsert[] = [];

    for (
      let month = startMonth;
      month <= currentMonth;
      month = addMonths(month, 1)
    ) {
      inserts.push({
        user_id: settings.user_id,
        movement_type: "auto_monthly_allocation",
        amount: settings.auto_monthly_amount,
        movement_date: toIsoDate(month),
        note: "Allocazione automatica mensile",
        auto_instance_key: `${settings.user_id}:${toIsoDate(month)}`
      });
    }

    if (inserts.length === 0) {
      continue;
    }

    const { error: upsertError } = await supabase
      .from("piggy_bank_movements")
      .upsert(inserts as never, {
        onConflict: "user_id,auto_instance_key",
        ignoreDuplicates: true
      });

    if (upsertError) {
      throw new Error(upsertError.message);
    }
  }
}

export async function getPiggyBankSummary(currentDate = new Date()): Promise<PiggyBankSummary> {
  await materializePiggyBankAutoAllocations(currentDate);

  const supabase = await createSupabaseServerClient();
  const [{ data: settings, error: settingsError }, { data: movements, error: movementsError }] =
    await Promise.all([
      supabase.from("piggy_bank_settings").select("*").maybeSingle(),
      supabase
        .from("piggy_bank_movements")
        .select("*")
        .order("movement_date", { ascending: false })
        .order("created_at", { ascending: false })
    ]);

  if (settingsError) {
    throw new Error(settingsError.message);
  }

  if (movementsError) {
    throw new Error(movementsError.message);
  }

  const movementRows = (movements ?? []) as PiggyBankMovementRow[];

  return {
    balance: calculatePiggyBankBalance(
      movementRows.map((item) => ({
        amount: item.amount,
        movementType: item.movement_type
      }))
    ),
    settings: settings ? mapSettings(settings as PiggyBankSettingsRow) : null,
    recentMovements: movementRows.slice(0, 5).map(mapMovement)
  };
}

export async function upsertPiggyBankSettings(
  userId: string,
  values: PiggyBankSettingsFormValues
) {
  const supabase = await createSupabaseServerClient();
  const payload: PiggyBankSettingsInsert = {
    user_id: userId,
    auto_monthly_amount: Number(values.autoMonthlyAmount),
    is_auto_enabled: values.isAutoEnabled,
    starts_on_month: normalizeMonthStart(values.startsOnMonth)
  };

  const { error } = await supabase
    .from("piggy_bank_settings")
    .upsert(payload as never, { onConflict: "user_id" });

  if (error) {
    throw new Error(error.message);
  }

  return getPiggyBankSummary();
}

export async function deletePiggyBankSettings(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("piggy_bank_settings")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return getPiggyBankSummary();
}

export async function createPiggyBankMovement(
  userId: string,
  values: PiggyBankMovementFormValues
) {
  const currentSummary = await getPiggyBankSummary();
  const supabase = await createSupabaseServerClient();

  if (
    values.movementType === "manual_release" &&
    Number(values.amount) > currentSummary.balance
  ) {
    throw new Error("Non puoi svincolare piu soldi di quanti ce ne siano nel salvadanaio.");
  }

  const payload: PiggyBankMovementInsert = {
    user_id: userId,
    movement_type: values.movementType,
    amount: Number(values.amount),
    movement_date: toIsoDate(new Date()),
    note: values.note || null
  };

  const { error } = await supabase
    .from("piggy_bank_movements")
    .insert(payload as never);

  if (error) {
    throw new Error(error.message);
  }

  return getPiggyBankSummary();
}
