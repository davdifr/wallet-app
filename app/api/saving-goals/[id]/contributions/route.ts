import { NextResponse } from "next/server";

import { goalContributionSchema } from "@/lib/validations/saving-goal";
import { getUser } from "@/services/auth/get-user";
import { addGoalContribution } from "@/services/saving-goals/saving-goals-service";

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
  const parsed = goalContributionSchema.safeParse({
    goalId: id,
    amount: body.amount,
    note: body.note ?? ""
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Controlla il contributo inserito.",
        errors: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  try {
    const goal = await addGoalContribution(user.id, parsed.data);
    return NextResponse.json({ goal });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Impossibile aggiungere il contributo."
      },
      { status: 500 }
    );
  }
}
