"use server";

import { revalidatePath } from "next/cache";

import { transactionSchema } from "@/lib/validations/transaction";
import { getUser } from "@/services/auth/get-user";
import {
  createTransaction,
  deleteTransaction,
  updateTransaction
} from "@/services/transactions/transactions-service";
import type { TransactionFormState } from "@/types/transactions";

export async function saveTransactionAction(
  _previousState: TransactionFormState,
  formData: FormData
): Promise<TransactionFormState> {
  const parsed = transactionSchema.safeParse({
    id: formData.get("id") || undefined,
    amount: formData.get("amount"),
    date: formData.get("date"),
    category: formData.get("category"),
    note: formData.get("note") ?? "",
    source: formData.get("source"),
    type: formData.get("type")
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
    const { id, ...values } = parsed.data;

    if (id) {
      await updateTransaction(id, values);
    } else {
      await createTransaction(user.id, values);
    }

    revalidatePath("/transactions");

    return {
      success: true,
      message: id ? "Transazione aggiornata." : "Transazione creata."
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Impossibile salvare la transazione."
    };
  }
}

export async function deleteTransactionAction(formData: FormData) {
  const id = formData.get("id");

  if (typeof id !== "string" || !id) {
    return;
  }

  const user = await getUser();

  if (!user) {
    return;
  }

  await deleteTransaction(id);
  revalidatePath("/transactions");
}
