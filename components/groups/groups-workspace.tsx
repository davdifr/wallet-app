"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { CreateGroupForm } from "@/components/groups/create-group-form";
import { GroupDetailCard } from "@/components/groups/group-detail-card";
import { GroupDirectory } from "@/components/groups/group-directory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type {
  AddGroupMemberFormValues,
  CreateGroupFormValues,
  CreateSharedExpenseFormValues,
  GroupBalanceSummary,
  Group as GroupType,
  GroupFormState,
  Settlement,
  SettleSplitFormValues,
  SharedExpense,
  UserInviteCandidate
} from "@/types/group-expenses";

type GroupDetails = {
  group: GroupType;
  expenses: SharedExpense[];
  settlements: Settlement[];
  summary: GroupBalanceSummary;
};

type GroupsApiResponse = {
  currentUserId: string | null;
  groups: GroupDetails[];
  inviteCandidates: UserInviteCandidate[];
};

type GroupsWorkspaceProps = {
  currentUserId: string | null;
  initialGroups: GroupDetails[];
  initialInviteCandidates: UserInviteCandidate[];
};

async function readResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { message?: string };

  if (!response.ok) {
    throw new Error(data.message ?? "Richiesta non riuscita.");
  }

  return data;
}

export function GroupsWorkspace({
  currentUserId: initialCurrentUserId,
  initialGroups,
  initialInviteCandidates
}: GroupsWorkspaceProps) {
  const [groups, setGroups] = useState(initialGroups);
  const [inviteCandidates, setInviteCandidates] = useState(initialInviteCandidates);
  const [currentUserId, setCurrentUserId] = useState<string | null>(initialCurrentUserId);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    initialGroups[0]?.group.id ?? null
  );
  const [pageError, setPageError] = useState<string | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [pendingAddMemberGroupId, setPendingAddMemberGroupId] = useState<string | null>(null);
  const [pendingCreateExpenseGroupId, setPendingCreateExpenseGroupId] = useState<string | null>(null);
  const [pendingSettleSplitId, setPendingSettleSplitId] = useState<string | null>(null);
  const [pendingAcceptSettlementId, setPendingAcceptSettlementId] = useState<string | null>(null);

  async function reloadGroups() {
    const response = await fetch("/api/groups", {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      cache: "no-store"
    });

    const data = await readResponse<GroupsApiResponse>(response);
    setGroups(data.groups);
    setInviteCandidates(data.inviteCandidates);
    setCurrentUserId(data.currentUserId);
    setSelectedGroupId((current) => {
      if (current && data.groups.some((item) => item.group.id === current)) {
        return current;
      }

      return data.groups[0]?.group.id ?? null;
    });

    return data;
  }

  async function handleCreateGroup(values: CreateGroupFormValues): Promise<GroupFormState> {
    setIsCreatingGroup(true);
    setPageError(null);

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(values)
      });

      await readResponse<{ success: boolean }>(response);
      const data = await reloadGroups();
      setSelectedGroupId(data.groups[0]?.group.id ?? null);
      setIsCreateModalOpen(false);
      return { success: true, message: "Gruppo creato." };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Impossibile creare il gruppo."
      };
    } finally {
      setIsCreatingGroup(false);
    }
  }

  async function handleAddMember(values: AddGroupMemberFormValues): Promise<GroupFormState> {
    setPendingAddMemberGroupId(values.groupId);
    setPageError(null);

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
      await reloadGroups();
      return { success: true, message: "Membro aggiunto." };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Impossibile aggiungere il membro."
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
      await reloadGroups();
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
      await reloadGroups();
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

    try {
      const response = await fetch(`/api/groups/settlements/${settlementId}/accept`, {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json" }
      });

      await readResponse<{ success: boolean }>(response);
      await reloadGroups();
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

  const selectedGroup =
    groups.find((item) => item.group.id === selectedGroupId) ?? groups[0] ?? null;

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="secondary" className="w-fit bg-white/80 text-slate-700">
              Group Expenses
            </Badge>
            <div className="mt-3">
              <h1 className="font-display text-3xl font-semibold text-slate-950">
                Spese di gruppo
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
                Prima scegli il gruppo, poi lavora su membri, spese condivise e rimborsi nel
                dettaglio.
              </p>
            </div>
          </div>

          <Button type="button" className="w-full sm:w-auto" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Nuovo gruppo
          </Button>
        </div>
      </section>

      {pageError ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {pageError}
        </div>
      ) : null}

      <section className="grid items-start gap-6 xl:grid-cols-[0.42fr_1fr]">
        <GroupDirectory
          groups={groups}
          selectedGroupId={selectedGroup?.group.id ?? null}
          onSelectGroup={setSelectedGroupId}
        />

        {selectedGroup ? (
          <GroupDetailCard
            group={selectedGroup}
            inviteCandidates={inviteCandidates}
            currentUserId={currentUserId}
            pendingAcceptSettlementId={pendingAcceptSettlementId}
            pendingAddMemberGroupId={pendingAddMemberGroupId}
            pendingCreateExpenseGroupId={pendingCreateExpenseGroupId}
            pendingSettleSplitId={pendingSettleSplitId}
            onAcceptSettlement={handleAcceptSettlement}
            onAddMember={handleAddMember}
            onCreateExpense={handleCreateExpense}
            onSettleSplit={handleSettleSplit}
          />
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center text-sm text-slate-500 shadow-soft">
            Crea o seleziona un gruppo per vedere spese, partecipanti e riepiloghi.
          </div>
        )}
      </section>

      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Nuovo gruppo"
        description="Crea un gruppo e poi aggiungi membri e spese condivise dal dettaglio."
      >
        <CreateGroupForm isSubmitting={isCreatingGroup} onSubmit={handleCreateGroup} />
      </Modal>
    </div>
  );
}
