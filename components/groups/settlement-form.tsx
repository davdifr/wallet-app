"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { settleSplitSchema } from "@/lib/validations/group-expense";
import { cn } from "@/lib/utils";
import type { GroupFormState, SettleSplitFormValues } from "@/types/group-expenses";

type SettlementFormProps = {
  groupId: string;
  expenseId: string;
  splitId: string;
  payerMemberId: string;
  payeeMemberId: string;
  remainingAmount: number;
  isSubmitting?: boolean;
  onSubmit: (values: SettleSplitFormValues) => Promise<GroupFormState>;
};

export function SettlementForm({
  groupId,
  expenseId,
  splitId,
  payerMemberId,
  payeeMemberId,
  remainingAmount,
  isSubmitting = false,
  onSubmit
}: SettlementFormProps) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [state, setState] = useState<GroupFormState>({ success: false });

  return (
    <form
      className="flex flex-col gap-2 rounded-2xl border border-input bg-card p-3"
      onSubmit={async (event) => {
        event.preventDefault();

        const values: SettleSplitFormValues = {
          groupId,
          expenseId,
          splitId,
          payerMemberId,
          payeeMemberId,
          amount,
          note
        };

        const parsed = settleSplitSchema.safeParse(values);

        if (!parsed.success) {
          setState({
            success: false,
            message: "Controlla i dati del rimborso.",
            errors: parsed.error.flatten().fieldErrors
          });
          return;
        }

        const nextState = await onSubmit(parsed.data);
        setState(nextState);

        if (nextState.success) {
          setAmount("");
          setNote("");
        }
      }}
    >
      <Input
        type="number"
        min="0.01"
        step="0.01"
        placeholder={`${remainingAmount}`}
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
      />
      <Input
        placeholder="Nota rimborso parziale"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <div
        className={cn(
          "rounded-xl border px-3 py-2 text-xs",
          state.success
            ? "border-input bg-muted text-foreground"
            : state.message
              ? "border-input bg-muted text-foreground"
              : "hidden"
        )}
      >
        {state.message}
      </div>
      <Button type="submit" size="sm" variant="outline" disabled={isSubmitting}>
        {isSubmitting ? "Registro..." : "Segna rimborso"}
      </Button>
    </form>
  );
}
