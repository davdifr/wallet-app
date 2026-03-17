"use server";

import { revalidatePath } from "next/cache";

import {
  goalContributionSchema,
  savingGoalSchema
} from "@/lib/validations/saving-goal";
import { getUser } from "@/services/auth/get-user";
import {
  addGoalContribution,
  createSavingGoal
} from "@/services/saving-goals/saving-goals-service";
import type {
  GoalContributionFormState,
  SavingGoalFormState
} from "@/types/saving-goals";

export async function createSavingGoalAction(
  _previousState: SavingGoalFormState,
  formData: FormData
): Promise<SavingGoalFormState> {
  const parsed = savingGoalSchema.safeParse({
    title: formData.get("title"),
    targetAmount: formData.get("targetAmount"),
    targetDate: formData.get("targetDate"),
    priority: formData.get("priority")
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
    await createSavingGoal(user.id, parsed.data);
    revalidatePath("/saving-goals");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Saving goal creato con successo."
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Impossibile creare il goal."
    };
  }
}

export async function addGoalContributionAction(
  _previousState: GoalContributionFormState,
  formData: FormData
): Promise<GoalContributionFormState> {
  const parsed = goalContributionSchema.safeParse({
    goalId: formData.get("goalId"),
    amount: formData.get("amount"),
    note: formData.get("note") ?? ""
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Controlla il contributo inserito.",
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
    await addGoalContribution(user.id, parsed.data);
    revalidatePath("/saving-goals");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Contributo aggiunto."
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossibile aggiungere il contributo."
    };
  }
}
