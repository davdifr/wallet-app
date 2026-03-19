"use client";

import Image from "next/image";
import { Trash2, UserPlus, Users } from "lucide-react";
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
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-input bg-card text-sm font-semibold text-foreground">
        {getInitials(name || "Membro")}
      </div>
    );
  }

  return (
    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-input bg-card">
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
  currentUserId: string | null;
  group: GroupDetails;
  inviteCandidates: UserInviteCandidate[];
  isSubmitting?: boolean;
  removingMemberId?: string | null;
  onAddMember: (values: AddGroupMemberFormValues) => Promise<GroupFormState>;
  onRemoveMember: (memberId: string) => Promise<GroupFormState>;
};

export function GroupMembersSection({
  currentUserId,
  group,
  inviteCandidates,
  isSubmitting = false,
  removingMemberId = null,
  onAddMember,
  onRemoveMember
}: GroupMembersSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currentUserMembership =
    currentUserId === null
      ? null
      : group.group.members.find((member) => member.userId === currentUserId) ?? null;
  const canManageMembers = currentUserMembership?.role === "owner";

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
      <Card className="bg-card">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-input p-2 text-foreground">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="font-display text-2xl text-foreground">
                  Membri
                </CardTitle>
                <p className="text-sm text-muted-foreground">
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
          <div className="space-y-3">
            {group.group.members.map((member) => (
              <div
                key={member.id}
                className="rounded-3xl border border-input bg-card p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <MemberAvatar
                    name={member.displayName || "Membro"}
                    avatarUrl={member.avatarUrl}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-medium text-foreground">{member.displayName}</p>
                      <span className="shrink-0 rounded-full border border-input bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        {roleLabel[member.role]}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {member.isGuest
                        ? member.guestEmail || "Guest senza email"
                        : member.email || "Utente registrato"}
                    </p>
                  </div>

                  {canManageMembers && member.role !== "owner" ? (
                    <div className="sm:ml-auto">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                        disabled={removingMemberId === member.id}
                        onClick={() => void onRemoveMember(member.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        {removingMemberId === member.id ? "Rimuovo..." : "Rimuovi"}
                      </Button>
                    </div>
                  ) : null}
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
