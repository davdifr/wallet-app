"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GroupFormState } from "@/types/group-expenses";

type AcceptSettlementFormProps = {
  settlementId: string;
  isSubmitting?: boolean;
  onSubmit: (settlementId: string) => Promise<GroupFormState>;
};

export function AcceptSettlementForm({
  settlementId,
  isSubmitting = false,
  onSubmit
}: AcceptSettlementFormProps) {
  const [state, setState] = useState<GroupFormState>({ success: false });

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        const nextState = await onSubmit(settlementId);
        setState(nextState);
      }}
    >
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
      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting ? "Confermo..." : "Accetta rimborso"}
      </Button>
    </form>
  );
}
