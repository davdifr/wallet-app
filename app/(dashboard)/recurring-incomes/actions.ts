"use server";

import { revalidatePath } from "next/cache";

import { recurringIncomeSchema } from "@/lib/validations/recurring-income";
import { getUser } from "@/services/auth/get-user";
import {
  createRecurringIncome,
  materializeRecurringIncomes,
  setRecurringIncomeActiveState
} from "@/services/recurring-incomes/recurring-income-service";
import type { RecurringIncomeFormState } from "@/types/recurring-incomes";

export async function createRecurringIncomeAction(
  _previousState: RecurringIncomeFormState,
  formData: FormData
): Promise<RecurringIncomeFormState> {
  const parsed = recurringIncomeSchema.safeParse({
    amount: formData.get("amount"),
    categorySlug: formData.get("categorySlug"),
    description: formData.get("description"),
    source: formData.get("source"),
    frequency: formData.get("frequency"),
    startsOn: formData.get("startsOn"),
    endsOn: formData.get("endsOn") ?? ""
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Controlla i campi evidenziati.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

  const user = await getUser();

  if (!user) {
    return {
      success: false,
      message: "Sessione non valida. Effettua di nuovo il login."
    };
  }

  try {
    await createRecurringIncome(user.id, parsed.data);
    revalidatePath("/recurring-incomes");
    revalidatePath("/transactions");

    return {
      success: true,
      message: "Entrata ricorrente creata."
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossibile creare l'entrata ricorrente."
    };
  }
}

export async function toggleRecurringIncomeAction(formData: FormData) {
  const id = formData.get("id");
  const isActive = formData.get("isActive");

  if (typeof id !== "string" || !id || typeof isActive !== "string") {
    return;
  }

  const user = await getUser();

  if (!user) {
    return;
  }

  await setRecurringIncomeActiveState(user.id, id, isActive === "true");
  revalidatePath("/recurring-incomes");
}

export async function materializeRecurringIncomesAction() {
  const user = await getUser();

  if (!user) {
    return;
  }

  await materializeRecurringIncomes();
  revalidatePath("/recurring-incomes");
  revalidatePath("/transactions");
}
