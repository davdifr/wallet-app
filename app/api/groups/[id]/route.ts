import { NextResponse } from "next/server";

import { groupIdSchema } from "@/lib/validations/group-expense";
import { getUser } from "@/services/auth/get-user";
import {
  deleteGroup,
  getGroupWithDetails,
  listUserInviteCandidates
} from "@/services/group-expenses/group-expenses-service";

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
  const parsedId = groupIdSchema.safeParse(id);

  if (!parsedId.success) {
    return NextResponse.json({ message: parsedId.error.issues[0]?.message }, { status: 400 });
  }

  try {
    const group = await deleteGroup(user.id, parsedId.data);
    return NextResponse.json({ group });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Impossibile eliminare il gruppo."
      },
      { status: getErrorStatus(error) }
    );
  }
}

export async function GET(_request: Request, context: RouteContext) {
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
    const [group, inviteCandidates] = await Promise.all([
      getGroupWithDetails(parsedId.data),
      listUserInviteCandidates()
    ]);

    if (!group) {
      return NextResponse.json({ message: "Gruppo non trovato." }, { status: 404 });
    }

    return NextResponse.json({
      currentUserId: user.id,
      group,
      inviteCandidates
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Impossibile caricare il gruppo."
      },
      { status: getErrorStatus(error) }
    );
  }
}
