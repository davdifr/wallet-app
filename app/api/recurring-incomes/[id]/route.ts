import { NextResponse } from "next/server";

import { getUser } from "@/services/auth/get-user";
import { setRecurringIncomeActiveState } from "@/services/recurring-incomes/recurring-income-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ message: "Sessione non valida." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as { isActive?: boolean };

  if (typeof body.isActive !== "boolean") {
    return NextResponse.json({ message: "Valore non valido." }, { status: 400 });
  }

  try {
    const recurringIncome = await setRecurringIncomeActiveState(id, body.isActive);
    return NextResponse.json({ recurringIncome });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Impossibile aggiornare la ricorrenza."
      },
      { status: 500 }
    );
  }
}
