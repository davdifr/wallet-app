"use client";

import Link from "next/link";
import { ArrowLeft, Coins, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { GroupExpensesSection } from "@/components/groups/group-expenses-section";
import { GroupMembersSection } from "@/components/groups/group-members-section";
import { GroupSettlementsSection } from "@/components/groups/group-settlements-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type {
  AddGroupMemberFormValues,
  CreateSharedExpenseFormValues,
  GroupDetails,
  GroupFormState,
  Group as GroupType,
  SettleSplitFormValues,
  UserInviteCandidate
} from "@/types/group-expenses";

type GroupApiResponse = {
  currentUserId: string | null;
  group: GroupDetails;
  inviteCandidates: UserInviteCandidate[];
};

type GroupDetailWorkspaceProps = {
  currentUserId: string | null;
  initialGroup: GroupDetails;
  initialInviteCandidates: UserInviteCandidate[];
};

async function readResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { message?: string };

  if (!response.ok) {
    throw new Error(data.message ?? "Richiesta non riuscita.");
  }

  return data;
}

export function GroupDetailWorkspace({
  currentUserId: initialCurrentUserId,
  initialGroup,
  initialInviteCandidates
}: GroupDetailWorkspaceProps) {
  const router = useRouter();
  const [group, setGroup] = useState(initialGroup);
  const [inviteCandidates, setInviteCandidates] = useState(initialInviteCandidates);
  const [currentUserId, setCurrentUserId] = useState<string | null>(initialCurrentUserId);
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageMessage, setPageMessage] = useState<string | null>(null);
  const [pendingAddMemberGroupId, setPendingAddMemberGroupId] = useState<string | null>(null);
  const [pendingCreateExpenseGroupId, setPendingCreateExpenseGroupId] = useState<string | null>(
    null
  );
  const [pendingDeleteGroupId, setPendingDeleteGroupId] = useState<string | null>(null);
  const [pendingSettleSplitId, setPendingSettleSplitId] = useState<string | null>(null);
  const [pendingAcceptSettlementId, setPendingAcceptSettlementId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  async function reloadGroup() {
    const response = await fetch(`/api/groups/${group.group.id}`, {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      cache: "no-store"
    });

    const data = await readResponse<GroupApiResponse>(response);
    setGroup(data.group);
    setInviteCandidates(data.inviteCandidates);
    setCurrentUserId(data.currentUserId);
  }

  async function handleAddMember(values: AddGroupMemberFormValues): Promise<GroupFormState> {
    setPendingAddMemberGroupId(values.groupId);
    setPageError(null);
    setPageMessage(null);

    try {
      const response = await fetch(`/api/groups/${values.groupId}/members`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(values)
      });

      await readResponse<{ success: boolean }>(response);
      await reloadGroup();
      return { success: true, message: "Membro aggiunto." };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Impossibile aggiungere il membro."
      };
    } finally {
      setPendingAddMemberGroupId(null);
    }
  }

  async function handleCreateExpense(
    values: CreateSharedExpenseFormValues
  ): Promise<GroupFormState> {
    setPendingCreateExpenseGroupId(values.groupId);
    setPageError(null);
    setPageMessage(null);

    try {
      const response = await fetch(`/api/groups/${values.groupId}/expenses`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(values)
      });

      await readResponse<{ success: boolean }>(response);
      await reloadGroup();
      return { success: true, message: "Spesa condivisa creata." };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Impossibile creare la spesa."
      };
    } finally {
      setPendingCreateExpenseGroupId(null);
    }
  }

  async function handleSettleSplit(values: SettleSplitFormValues): Promise<GroupFormState> {
    setPendingSettleSplitId(values.splitId);
    setPageError(null);
    setPageMessage(null);

    try {
      const response = await fetch("/api/groups/settlements", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(values)
      });

      const data = await readResponse<{ result: { status: "pending" | "completed" } }>(response);
      await reloadGroup();
      return {
        success: true,
        message:
          data.result.status === "pending"
            ? "Rimborso registrato: ora serve l'accettazione di uno degli utenti coinvolti."
            : "Rimborso registrato."
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Impossibile registrare il rimborso."
      };
    } finally {
      setPendingSettleSplitId(null);
    }
  }

  async function handleAcceptSettlement(settlementId: string): Promise<GroupFormState> {
    setPendingAcceptSettlementId(settlementId);
    setPageError(null);
    setPageMessage(null);

    try {
      const response = await fetch(`/api/groups/settlements/${settlementId}/accept`, {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json" }
      });

      await readResponse<{ success: boolean }>(response);
      await reloadGroup();
      return { success: true, message: "Rimborso accettato." };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Impossibile accettare il rimborso."
      };
    } finally {
      setPendingAcceptSettlementId(null);
    }
  }

  async function handleDeleteGroup(): Promise<void> {
    setPendingDeleteGroupId(group.group.id);
    setPageError(null);
    setPageMessage(null);

    try {
      const response = await fetch(`/api/groups/${group.group.id}`, {
        method: "DELETE",
        credentials: "same-origin",
        headers: { Accept: "application/json" }
      });

      await readResponse<{ group: GroupType }>(response);
      router.push("/groups");
      router.refresh();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Impossibile eliminare il gruppo.");
    } finally {
      setPendingDeleteGroupId(null);
    }
  }

  const currentUserMembership = useMemo(
    () =>
      currentUserId === null
        ? null
        : group.group.members.find((member) => member.userId === currentUserId) ?? null,
    [currentUserId, group.group.members]
  );
  const canDeleteGroup = currentUserMembership?.role === "owner";

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/groups">
              <ArrowLeft className="h-4 w-4" />
              Torna ai gruppi
            </Link>
          </Button>

          <Button type="button" asChild className="w-full sm:w-auto">
            <a href="#rimborsi-gruppo">
              <Coins className="h-4 w-4" />
              Registra rimborso
            </a>
          </Button>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="bg-white text-slate-700">
                  {group.group.members.length} membri
                </Badge>
                <Badge variant="secondary" className="bg-white text-slate-700">
                  {group.expenses.length} spese
                </Badge>
              </div>
              <div>
                <h1 className="font-display text-3xl font-semibold text-slate-950">
                  {group.group.name}
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-500 sm:text-base">
                  {group.group.description || "Nessuna descrizione disponibile."}
                </p>
              </div>
            </div>

            {canDeleteGroup ? (
              <Button
                type="button"
                variant="outline"
                className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                disabled={pendingDeleteGroupId === group.group.id}
                onClick={() => setIsDeleteModalOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                {pendingDeleteGroupId === group.group.id ? "Elimino..." : "Elimina gruppo"}
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {pageError ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {pageError}
        </div>
      ) : null}

      {pageMessage ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
          {pageMessage}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <GroupMembersSection
            group={group}
            inviteCandidates={inviteCandidates}
            isSubmitting={pendingAddMemberGroupId === group.group.id}
            onAddMember={handleAddMember}
          />

          <div id="rimborsi-gruppo" className="scroll-mt-24">
            <GroupSettlementsSection
              currentUserId={currentUserId}
              group={group}
              pendingAcceptSettlementId={pendingAcceptSettlementId}
              onAcceptSettlement={handleAcceptSettlement}
            />
          </div>
        </div>

        <div id="spese-gruppo" className="scroll-mt-24">
          <GroupExpensesSection
            group={group}
            pendingCreateExpenseGroupId={pendingCreateExpenseGroupId}
            pendingSettleSplitId={pendingSettleSplitId}
            onCreateExpense={handleCreateExpense}
            onSettleSplit={handleSettleSplit}
          />
        </div>
      </div>

      <Modal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title="Conferma eliminazione"
        description="Il gruppo verra eliminato solo se non contiene spese, rimborsi o transazioni collegate."
      >
        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 px-5 py-4 text-sm text-slate-600">
            <p className="font-medium text-slate-900">{group.group.name}</p>
            <p className="mt-1">
              Membri {group.group.members.length} · spese {group.expenses.length} · rimborsi{" "}
              {group.settlements.length}
            </p>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={pendingDeleteGroupId === group.group.id}
            >
              Annulla
            </Button>
            <Button
              type="button"
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={() => void handleDeleteGroup()}
              disabled={pendingDeleteGroupId === group.group.id}
            >
              {pendingDeleteGroupId === group.group.id ? "Elimino..." : "Elimina"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
