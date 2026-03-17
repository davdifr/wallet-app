import { NextResponse } from "next/server";

import { getUser } from "@/services/auth/get-user";
import { materializeRecurringIncomes } from "@/services/recurring-incomes/recurring-income-service";

export async function POST() {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ message: "Sessione non valida." }, { status: 401 });
  }

  try {
    const result = await materializeRecurringIncomes();
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Impossibile sincronizzare le ricorrenze."
      },
      { status: 500 }
    );
  }
}
