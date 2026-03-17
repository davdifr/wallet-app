"use server";

import { revalidatePath } from "next/cache";

import {
  addGroupMemberSchema,
  createGroupSchema,
  createSharedExpenseSchema,
  settleSplitSchema
} from "@/lib/validations/group-expense";
import { getUser } from "@/services/auth/get-user";
import {
  acceptSettlement,
  addGroupMember,
  createGroup,
  createSharedExpense,
  settleSharedExpenseSplit
} from "@/services/group-expenses/group-expenses-service";
import type { GroupFormState } from "@/types/group-expenses";

export async function createGroupAction(
  _previousState: GroupFormState,
  formData: FormData
): Promise<GroupFormState> {
  const parsed = createGroupSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? ""
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Controlla i campi del gruppo.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

  const user = await getUser();
  if (!user) return { success: false, message: "Sessione non valida." };

  try {
    await createGroup(user.id, parsed.data);
    revalidatePath("/groups");
    return { success: true, message: "Gruppo creato." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Impossibile creare il gruppo."
    };
  }
}

export async function addGroupMemberAction(
  _previousState: GroupFormState,
  formData: FormData
): Promise<GroupFormState> {
  const parsed = addGroupMemberSchema.safeParse({
    groupId: formData.get("groupId"),
    email: formData.get("email") ?? "",
    displayName: formData.get("displayName"),
    guestEmail: formData.get("guestEmail") ?? "",
    memberType: formData.get("memberType")
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Controlla i dati del membro.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    await addGroupMember(parsed.data);
    revalidatePath("/groups");
    return { success: true, message: "Membro aggiunto." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Impossibile aggiungere il membro."
    };
  }
}

export async function createSharedExpenseAction(
  _previousState: GroupFormState,
  formData: FormData
): Promise<GroupFormState> {
  const parsed = createSharedExpenseSchema.safeParse({
    groupId: formData.get("groupId"),
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    amount: formData.get("amount"),
    expenseDate: formData.get("expenseDate"),
    splitMethod: formData.get("splitMethod"),
    paidByMemberId: formData.get("paidByMemberId"),
    splitValues: formData.get("splitValues")
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Controlla i dati della spesa condivisa.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

  const user = await getUser();
  if (!user) return { success: false, message: "Sessione non valida." };

  try {
    await createSharedExpense(user.id, parsed.data);
    revalidatePath("/groups");
    revalidatePath("/transactions");
    return { success: true, message: "Spesa condivisa creata." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Impossibile creare la spesa."
    };
  }
}

export async function settleSplitAction(
  _previousState: GroupFormState,
  formData: FormData
): Promise<GroupFormState> {
  const parsed = settleSplitSchema.safeParse({
    groupId: formData.get("groupId"),
    expenseId: formData.get("expenseId"),
    splitId: formData.get("splitId"),
    payerMemberId: formData.get("payerMemberId"),
    payeeMemberId: formData.get("payeeMemberId"),
    amount: formData.get("amount"),
    note: formData.get("note") ?? ""
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Controlla i dati del rimborso.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

  const user = await getUser();
  if (!user) return { success: false, message: "Sessione non valida." };

  try {
    const result = await settleSharedExpenseSplit(user.id, parsed.data);
    revalidatePath("/groups");
    revalidatePath("/transactions");
    return {
      success: true,
      message:
        result.status === "pending"
          ? "Rimborso registrato: ora serve l'accettazione di uno degli utenti coinvolti."
          : "Rimborso registrato."
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Impossibile registrare il rimborso."
    };
  }
}

export async function acceptSettlementAction(
  _previousState: GroupFormState,
  formData: FormData
): Promise<GroupFormState> {
  const settlementId = formData.get("settlementId");

  if (typeof settlementId !== "string" || settlementId.length === 0) {
    return {
      success: false,
      message: "Rimborso non valido."
    };
  }

  const user = await getUser();
  if (!user) return { success: false, message: "Sessione non valida." };

  try {
    await acceptSettlement(user.id, settlementId);
    revalidatePath("/groups");
    revalidatePath("/transactions");
    return { success: true, message: "Rimborso accettato." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Impossibile accettare il rimborso."
    };
  }
}
