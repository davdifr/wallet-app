import { NextResponse } from "next/server";

import { getUser } from "@/services/auth/get-user";
import { getPiggyBankSummary } from "@/services/piggy-bank/piggy-bank-service";

export async function GET() {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ message: "Sessione non valida." }, { status: 401 });
  }

  try {
    const piggyBank = await getPiggyBankSummary();
    return NextResponse.json({ piggyBank });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Impossibile caricare il salvadanaio."
      },
      { status: 500 }
    );
  }
}
