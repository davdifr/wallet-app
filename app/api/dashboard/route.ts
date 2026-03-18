import { NextResponse } from "next/server";

import { getUser } from "@/services/auth/get-user";
import {
  getDashboardData,
  serializeDashboardData
} from "@/services/dashboard/dashboard-service";

export async function GET() {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ message: "Sessione non valida." }, { status: 401 });
  }

  try {
    const data = await getDashboardData();

    return NextResponse.json(serializeDashboardData(data));
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Impossibile caricare la dashboard."
      },
      { status: 500 }
    );
  }
}
