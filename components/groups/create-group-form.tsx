"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createGroupSchema } from "@/lib/validations/group-expense";
import { cn } from "@/lib/utils";
import type { CreateGroupFormValues, GroupFormState } from "@/types/group-expenses";

type CreateGroupFormProps = {
  isSubmitting?: boolean;
  onSubmit: (values: CreateGroupFormValues) => Promise<GroupFormState>;
};

const emptyValues: CreateGroupFormValues = {
  name: "",
  description: ""
};

export function CreateGroupForm({
  isSubmitting = false,
  onSubmit
}: CreateGroupFormProps) {
  const [values, setValues] = useState<CreateGroupFormValues>(emptyValues);
  const [state, setState] = useState<GroupFormState>({ success: false });

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();

        const parsed = createGroupSchema.safeParse(values);

        if (!parsed.success) {
          setState({
            success: false,
            message: "Controlla i campi del gruppo.",
            errors: parsed.error.flatten().fieldErrors
          });
          return;
        }

        const nextState = await onSubmit(parsed.data);
        setState(nextState);

        if (nextState.success) {
          setValues(emptyValues);
        }
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="name">Nome gruppo</Label>
        <Input
          id="name"
          name="name"
          placeholder="Weekend a Roma, Casa condivisa..."
          value={values.name}
          onChange={(event) =>
            setValues((current) => ({ ...current, name: event.target.value }))
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descrizione</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Contesto del gruppo"
          value={values.description}
          onChange={(event) =>
            setValues((current) => ({ ...current, description: event.target.value }))
          }
        />
      </div>
      <div
        className={cn(
          "rounded-2xl border px-4 py-3 text-sm",
          state.success
            ? "border-input bg-muted text-foreground"
            : state.message
              ? "border-input bg-muted text-foreground"
              : "hidden"
        )}
      >
        {state.message}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creazione in corso..." : "Crea gruppo"}
      </Button>
    </form>
  );
}
