import { NextResponse } from "next/server";

import { piggyBankSettingsSchema } from "@/lib/validations/piggy-bank";
import { getUser } from "@/services/auth/get-user";
import { upsertPiggyBankSettings } from "@/services/piggy-bank/piggy-bank-service";

export async function PATCH(request: Request) {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ message: "Sessione non valida." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = piggyBankSettingsSchema.safeParse(body);

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
    const piggyBank = await upsertPiggyBankSettings(user.id, parsed.data);
    return NextResponse.json({ piggyBank });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Impossibile aggiornare il salvadanaio."
      },
      { status: 500 }
    );
  }
}
