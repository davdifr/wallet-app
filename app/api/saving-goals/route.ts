import { NextResponse } from "next/server";

import { savingGoalSchema } from "@/lib/validations/saving-goal";
import { getUser } from "@/services/auth/get-user";
import {
  createSavingGoal,
  listSavingGoals
} from "@/services/saving-goals/saving-goals-service";

export async function GET() {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ message: "Sessione non valida." }, { status: 401 });
  }

  try {
    const goals = await listSavingGoals();
    return NextResponse.json({ goals });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Impossibile caricare i goal."
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
  const parsed = savingGoalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Controlla i campi evidenziati.",
        errors: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  try {
    const goal = await createSavingGoal(user.id, parsed.data);
    return NextResponse.json({ goal });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Impossibile creare il goal."
      },
      { status: 500 }
    );
  }
}
