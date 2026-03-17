import { NextResponse } from "next/server";

import { transactionSchema } from "@/lib/validations/transaction";
import { getUser } from "@/services/auth/get-user";
import {
  deleteTransaction,
  updateTransaction
} from "@/services/transactions/transactions-service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ message: "Sessione non valida." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = transactionSchema.safeParse({
    ...body,
    id
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Controlla i campi evidenziati.",
        errors: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  const { id: _id, ...values } = parsed.data;

  try {
    const transaction = await updateTransaction(id, values);
    return NextResponse.json({ transaction });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Impossibile aggiornare la transazione."
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ message: "Sessione non valida." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const transaction = await deleteTransaction(id);
    return NextResponse.json({ transaction });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Impossibile eliminare la transazione."
      },
      { status: 500 }
    );
  }
}
