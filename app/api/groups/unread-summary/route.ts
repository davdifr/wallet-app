import { NextResponse } from "next/server";

import { getUser } from "@/services/auth/get-user";
import { getGroupsUnreadSummary } from "@/services/group-expenses/group-expenses-service";

export async function GET() {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ message: "Sessione non valida." }, { status: 401 });
  }

  try {
    const summary = await getGroupsUnreadSummary(user.id);
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Impossibile caricare le notifiche dei gruppi."
      },
      { status: 500 }
    );
  }
}
