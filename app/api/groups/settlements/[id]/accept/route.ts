import { NextResponse } from "next/server";

import { getUser } from "@/services/auth/get-user";
import { acceptSettlement } from "@/services/group-expenses/group-expenses-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ message: "Sessione non valida." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    await acceptSettlement(user.id, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Impossibile accettare il rimborso."
      },
      { status: 500 }
    );
  }
}
