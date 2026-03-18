import { NextResponse } from "next/server";

import { addGroupMemberSchema } from "@/lib/validations/group-expense";
import { getUser } from "@/services/auth/get-user";
import { addGroupMember } from "@/services/group-expenses/group-expenses-service";

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

export async function POST(request: Request, context: RouteContext) {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ message: "Sessione non valida." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = addGroupMemberSchema.safeParse({
    ...body,
    groupId: id
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Controlla i dati del membro.",
        errors: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  try {
    await addGroupMember(parsed.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Impossibile aggiungere il membro."
      },
      { status: getErrorStatus(error) }
    );
  }
}
