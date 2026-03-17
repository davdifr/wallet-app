import { NextResponse } from "next/server";

import { createSharedExpenseSchema } from "@/lib/validations/group-expense";
import { getUser } from "@/services/auth/get-user";
import { createSharedExpense } from "@/services/group-expenses/group-expenses-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ message: "Sessione non valida." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = createSharedExpenseSchema.safeParse({
    ...body,
    groupId: id
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Controlla i dati della spesa condivisa.",
        errors: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  try {
    await createSharedExpense(user.id, parsed.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Impossibile creare la spesa."
      },
      { status: 500 }
    );
  }
}
