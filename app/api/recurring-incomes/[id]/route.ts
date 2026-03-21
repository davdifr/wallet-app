import { NextResponse } from "next/server";

import { recurringIncomeIdSchema } from "@/lib/validations/recurring-income";
import { getUser } from "@/services/auth/get-user";
import {
  deleteRecurringIncome,
  setRecurringIncomeActiveState
} from "@/services/recurring-incomes/recurring-income-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function getErrorStatus(error: unknown) {
  if (
    error instanceof Error &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
  ) {
    return error.statusCode;
  }

  return 500;
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ message: "Sessione non valida." }, { status: 401 });
  }

  const { id } = await context.params;
  const parsedId = recurringIncomeIdSchema.safeParse(id);

  if (!parsedId.success) {
    return NextResponse.json({ message: parsedId.error.issues[0]?.message }, { status: 400 });
  }

  const body = (await request.json()) as { isActive?: boolean };

  if (typeof body.isActive !== "boolean") {
    return NextResponse.json({ message: "Valore non valido." }, { status: 400 });
  }

  try {
    const recurringIncome = await setRecurringIncomeActiveState(
      user.id,
      parsedId.data,
      body.isActive
    );
    return NextResponse.json({ recurringIncome });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Impossibile aggiornare la ricorrenza."
      },
      { status: getErrorStatus(error) }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ message: "Sessione non valida." }, { status: 401 });
  }

  const { id } = await context.params;
  const parsedId = recurringIncomeIdSchema.safeParse(id);

  if (!parsedId.success) {
    return NextResponse.json({ message: parsedId.error.issues[0]?.message }, { status: 400 });
  }

  try {
    const recurringIncome = await deleteRecurringIncome(user.id, parsedId.data);
    return NextResponse.json({ recurringIncome });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Impossibile eliminare la ricorrenza."
      },
      { status: getErrorStatus(error) }
    );
  }
}
