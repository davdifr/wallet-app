import { NextResponse } from "next/server";

import { savingGoalIdSchema } from "@/lib/validations/saving-goal";
import { getUser } from "@/services/auth/get-user";
import { deleteSavingGoal } from "@/services/saving-goals/saving-goals-service";

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

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ message: "Sessione non valida." }, { status: 401 });
  }

  const { id } = await context.params;
  const parsedId = savingGoalIdSchema.safeParse(id);

  if (!parsedId.success) {
    return NextResponse.json({ message: parsedId.error.issues[0]?.message }, { status: 400 });
  }

  try {
    const goal = await deleteSavingGoal(user.id, parsedId.data);
    return NextResponse.json({ goal });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Impossibile eliminare il goal."
      },
      { status: getErrorStatus(error) }
    );
  }
}
