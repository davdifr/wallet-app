"use client";

import Image from "next/image";
import { UserPlus, Users } from "lucide-react";
import { useState } from "react";

import { GroupMemberForm } from "@/components/groups/group-member-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import type {
  AddGroupMemberFormValues,
  GroupDetails,
  GroupFormState,
  UserInviteCandidate
} from "@/types/group-expenses";

const roleLabel = {
  owner: "Proprietario",
  admin: "Admin",
  member: "Membro"
} as const;

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type MemberAvatarProps = {
  name: string;
  avatarUrl: string | null;
};

function MemberAvatar({ name, avatarUrl }: MemberAvatarProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const shouldShowImage = Boolean(avatarUrl) && !hasImageError;

  if (!shouldShowImage) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white shadow-sm">
        {getInitials(name || "Membro")}
      </div>
    );
  }

  return (
    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <Image
        src={avatarUrl ?? ""}
        alt={`Avatar di ${name}`}
        fill
        sizes="48px"
        className="object-cover"
        onError={() => setHasImageError(true)}
      />
    </div>
  );
}

type GroupMembersSectionProps = {
  group: GroupDetails;
  inviteCandidates: UserInviteCandidate[];
  isSubmitting?: boolean;
  onAddMember: (values: AddGroupMemberFormValues) => Promise<GroupFormState>;
};

export function GroupMembersSection({
  group,
  inviteCandidates,
  isSubmitting = false,
  onAddMember
}: GroupMembersSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const availableCandidates = inviteCandidates.filter(
    (candidate) => !group.group.members.some((member) => member.userId === candidate.id)
  );

  async function handleAddMember(values: AddGroupMemberFormValues) {
    const result = await onAddMember(values);

    if (result.success) {
      setIsModalOpen(false);
    }

    return result;
  }

  return (
    <>
      <Card className="border-white/70 bg-white/85 shadow-soft backdrop-blur">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-950 p-2 text-white">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="font-display text-2xl text-slate-950">
                  Membri
                </CardTitle>
                <p className="text-sm text-slate-500">
                  Invita utenti registrati o aggiungi partecipanti guest.
                </p>
              </div>
            </div>

            <Button type="button" variant="outline" onClick={() => setIsModalOpen(true)}>
              <UserPlus className="h-4 w-4" />
              Aggiungi membro
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {group.group.members.map((member) => (
              <div
                key={member.id}
                className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4"
              >
                <div className="flex items-center gap-3">
                  <MemberAvatar
                    name={member.displayName || "Membro"}
                    avatarUrl={member.avatarUrl}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-slate-950">{member.displayName}</p>
                      <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                        {roleLabel[member.role]}
                      </span>
                    </div>

                    <p className="mt-1 break-all text-sm text-slate-500">
                      {member.isGuest
                        ? member.guestEmail || "Guest senza email"
                        : member.email || "Utente registrato"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Modal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title="Aggiungi membro"
        description="Invita un utente registrato oppure crea un partecipante guest."
        className="max-w-3xl"
      >
        <GroupMemberForm
          groupId={group.group.id}
          inviteCandidates={availableCandidates}
          isSubmitting={isSubmitting}
          onSubmit={handleAddMember}
        />
      </Modal>
    </>
  );
}
