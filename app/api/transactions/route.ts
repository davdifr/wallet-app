import { NextResponse } from "next/server";

import { transactionSchema } from "@/lib/validations/transaction";
import { getUser } from "@/services/auth/get-user";
import {
  createTransaction,
  listTransactionCategories,
  listTransactionMonths,
  listTransactions
} from "@/services/transactions/transactions-service";
import type { TransactionFilters } from "@/types/transactions";

export async function GET(request: Request) {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ message: "Sessione non valida." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const filters: TransactionFilters = {
    month: searchParams.get("month") || undefined,
    category: searchParams.get("category") || undefined,
    type: type === "income" || type === "expense" || type === "all" ? type : undefined
  };

  try {
    const [transactions, categories, availableMonths] = await Promise.all([
      listTransactions(filters),
      listTransactionCategories(),
      listTransactionMonths()
    ]);

    return NextResponse.json({
      transactions,
      categories,
      availableMonths
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Impossibile caricare le transazioni."
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
  const parsed = transactionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Controlla i campi evidenziati.",
        errors: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  const { id: _id, ...values } = parsed.data;

  try {
    const transaction = await createTransaction(user.id, values);

    return NextResponse.json({ transaction });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Impossibile creare la transazione."
      },
      { status: 500 }
    );
  }
}
