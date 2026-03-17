"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { addGroupMemberSchema } from "@/lib/validations/group-expense";
import { cn } from "@/lib/utils";
import type {
  AddGroupMemberFormValues,
  GroupFormState,
  UserInviteCandidate
} from "@/types/group-expenses";

type GroupMemberFormProps = {
  groupId: string;
  inviteCandidates: UserInviteCandidate[];
  isSubmitting?: boolean;
  onSubmit: (values: AddGroupMemberFormValues) => Promise<GroupFormState>;
};

export function GroupMemberForm({
  groupId,
  inviteCandidates,
  isSubmitting = false,
  onSubmit
}: GroupMemberFormProps) {
  const [memberType, setMemberType] = useState<"app_user" | "guest">("app_user");
  const [values, setValues] = useState<AddGroupMemberFormValues>({
    groupId,
    email: "",
    displayName: "",
    guestEmail: "",
    memberType: "app_user"
  });
  const [state, setState] = useState<GroupFormState>({ success: false });

  return (
    <form
      className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50/80 p-4"
      onSubmit={async (event) => {
        event.preventDefault();

        const parsed = addGroupMemberSchema.safeParse(values);

        if (!parsed.success) {
          setState({
            success: false,
            message: "Controlla i dati del membro.",
            errors: parsed.error.flatten().fieldErrors
          });
          return;
        }

        const nextState = await onSubmit(parsed.data);
        setState(nextState);

        if (nextState.success) {
          setMemberType("app_user");
          setValues({
            groupId,
            email: "",
            displayName: "",
            guestEmail: "",
            memberType: "app_user"
          });
        }
      }}
    >
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={`memberType-${groupId}`}>Tipo</Label>
          <Select
            id={`memberType-${groupId}`}
            value={memberType}
            onChange={(event) => {
              const nextType = event.target.value === "guest" ? "guest" : "app_user";
              setMemberType(nextType);
              setValues((current) => ({
                ...current,
                memberType: nextType,
                email: nextType === "app_user" ? current.email : "",
                displayName: nextType === "guest" ? current.displayName : "",
                guestEmail: nextType === "guest" ? current.guestEmail : ""
              }));
            }}
          >
            <option value="app_user">Utente app</option>
            <option value="guest">Guest</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`email-${groupId}`}>
            {memberType === "app_user" ? "Ricerca per email" : "Email ospite"}
          </Label>
          <Input
            id={`email-${groupId}`}
            placeholder={
              memberType === "app_user"
                ? "cerca utente@wallet.app"
                : "opzionale@guest.com"
            }
            list={memberType === "app_user" ? `invite-candidates-${groupId}` : undefined}
            value={memberType === "app_user" ? values.email : values.guestEmail}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                email: memberType === "app_user" ? event.target.value : current.email,
                guestEmail:
                  memberType === "guest" ? event.target.value : current.guestEmail
              }))
            }
          />
          {memberType === "app_user" ? (
            <datalist id={`invite-candidates-${groupId}`}>
              {inviteCandidates.map((candidate) => (
                <option key={candidate.id} value={candidate.email}>
                  {candidate.fullName ?? candidate.email}
                </option>
              ))}
            </datalist>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`displayName-${groupId}`}>Nome visualizzato</Label>
          <Input
            id={`displayName-${groupId}`}
            placeholder={memberType === "guest" ? "Anna" : "opzionale"}
            disabled={memberType === "app_user"}
            value={values.displayName}
            onChange={(event) =>
              setValues((current) => ({ ...current, displayName: event.target.value }))
            }
          />
        </div>
      </div>
      <div
        className={cn(
          "rounded-2xl border px-3 py-2 text-xs",
          state.success
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : state.message
              ? "border-red-200 bg-red-50 text-red-700"
              : "hidden"
        )}
      >
        {state.message}
      </div>
      <Button type="submit" size="sm" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Aggiunta..." : "Aggiungi membro"}
      </Button>
    </form>
  );
}
