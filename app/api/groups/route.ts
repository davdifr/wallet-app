import { NextResponse } from "next/server";

import { createGroupSchema } from "@/lib/validations/group-expense";
import { getUser } from "@/services/auth/get-user";
import {
  createGroup,
  listGroupsWithDetails,
  listUserInviteCandidates
} from "@/services/group-expenses/group-expenses-service";

export async function GET() {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ message: "Sessione non valida." }, { status: 401 });
  }

  try {
    const [groups, inviteCandidates] = await Promise.all([
      listGroupsWithDetails(),
      listUserInviteCandidates()
    ]);

    return NextResponse.json({
      currentUserId: user.id,
      groups,
      inviteCandidates
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Impossibile caricare i gruppi."
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
  const parsed = createGroupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Controlla i campi del gruppo.",
        errors: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  try {
    await createGroup(user.id, parsed.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Impossibile creare il gruppo."
      },
      { status: 500 }
    );
  }
}
