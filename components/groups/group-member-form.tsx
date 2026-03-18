"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

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
  const emailQuery = values.email.trim().toLowerCase();
  const suggestedCandidates = useMemo(() => {
    if (memberType !== "app_user" || emailQuery.length === 0) {
      return [];
    }

    return inviteCandidates
      .filter((candidate) => {
        const normalizedEmail = candidate.email.toLowerCase();
        const normalizedName = candidate.fullName?.toLowerCase() ?? "";

        return (
          normalizedEmail.includes(emailQuery) ||
          normalizedName.includes(emailQuery)
        );
      })
      .slice(0, 5);
  }, [emailQuery, inviteCandidates, memberType]);

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
          <div className="space-y-2">
            <div className="relative">
              {memberType === "app_user" ? (
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              ) : null}
              <Input
                id={`email-${groupId}`}
                className={memberType === "app_user" ? "pl-10" : undefined}
                placeholder={
                  memberType === "app_user"
                    ? "Cerca per email o nome"
                    : "opzionale@guest.com"
                }
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
            </div>

            {memberType === "app_user" && suggestedCandidates.length > 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                <p className="px-2 pb-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  Suggerimenti
                </p>
                <div className="space-y-1">
                  {suggestedCandidates.map((candidate) => (
                    <button
                      key={candidate.id}
                      type="button"
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-slate-50"
                      onClick={() => {
                        setValues((current) => ({
                          ...current,
                          email: candidate.email
                        }));
                        setState({ success: false });
                      }}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {candidate.fullName ?? candidate.email}
                        </p>
                        {candidate.fullName ? (
                          <p className="truncate text-xs text-slate-500">{candidate.email}</p>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-xs text-slate-400">Seleziona</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
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
