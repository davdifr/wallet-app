import { NextResponse } from "next/server";

import { groupIdSchema } from "@/lib/validations/group-expense";
import { getUser } from "@/services/auth/get-user";
import { markGroupSharedExpensesViewed } from "@/services/group-expenses/group-expenses-service";

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

export async function POST(_request: Request, context: RouteContext) {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ message: "Sessione non valida." }, { status: 401 });
  }

  const { id } = await context.params;
  const parsedId = groupIdSchema.safeParse(id);

  if (!parsedId.success) {
    return NextResponse.json({ message: parsedId.error.issues[0]?.message }, { status: 400 });
  }

  try {
    const result = await markGroupSharedExpensesViewed(user.id, parsedId.data);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Impossibile segnare il gruppo come visto."
      },
      { status: getErrorStatus(error) }
    );
  }
}
