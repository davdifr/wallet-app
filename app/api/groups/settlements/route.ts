import { NextResponse } from "next/server";

import { settleSplitSchema } from "@/lib/validations/group-expense";
import { getUser } from "@/services/auth/get-user";
import { settleSharedExpenseSplit } from "@/services/group-expenses/group-expenses-service";

export async function POST(request: Request) {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ message: "Sessione non valida." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = settleSplitSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Controlla i dati del rimborso.",
        errors: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  try {
    const result = await settleSharedExpenseSplit(user.id, parsed.data);
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Impossibile registrare il rimborso."
      },
      { status: 500 }
    );
  }
}
