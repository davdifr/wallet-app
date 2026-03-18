import { NextResponse } from "next/server";

import { groupIdSchema, groupMemberIdSchema } from "@/lib/validations/group-expense";
import { getUser } from "@/services/auth/get-user";
import { removeGroupMember } from "@/services/group-expenses/group-expenses-service";

type RouteContext = {
  params: Promise<{ id: string; memberId: string }>;
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

  const { id, memberId } = await context.params;
  const parsedGroupId = groupIdSchema.safeParse(id);
  const parsedMemberId = groupMemberIdSchema.safeParse(memberId);

  if (!parsedGroupId.success) {
    return NextResponse.json(
      { message: parsedGroupId.error.issues[0]?.message },
      { status: 400 }
    );
  }

  if (!parsedMemberId.success) {
    return NextResponse.json(
      { message: parsedMemberId.error.issues[0]?.message },
      { status: 400 }
    );
  }

  try {
    const member = await removeGroupMember(user.id, parsedGroupId.data, parsedMemberId.data);
    return NextResponse.json({ member });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Impossibile rimuovere il membro."
      },
      { status: getErrorStatus(error) }
    );
  }
}
