import { NextResponse } from "next/server";

import { recurringIncomeSchema } from "@/lib/validations/recurring-income";
import { getUser } from "@/services/auth/get-user";
import {
  createRecurringIncome,
  listRecurringIncomes,
  materializeRecurringIncomes
} from "@/services/recurring-incomes/recurring-income-service";

export async function GET() {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ message: "Sessione non valida." }, { status: 401 });
  }

  try {
    await materializeRecurringIncomes();
    const recurringIncomes = await listRecurringIncomes();
    return NextResponse.json({ recurringIncomes });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Impossibile caricare le ricorrenze."
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ message: "Sessione non valida." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = recurringIncomeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Controlla i campi evidenziati.",
        errors: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  try {
    const recurringIncome = await createRecurringIncome(user.id, parsed.data);
    return NextResponse.json({ recurringIncome });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Impossibile creare l'entrata ricorrente."
      },
      { status: 500 }
    );
  }
}
