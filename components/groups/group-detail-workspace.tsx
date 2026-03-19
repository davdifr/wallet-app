"use client";

import Link from "next/link";
import { ArrowLeft, Coins, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { useSyncSourceId } from "@/components/providers/dashboard-query-provider";
import { GroupExpensesSection } from "@/components/groups/group-expenses-section";
import { GroupMembersSection } from "@/components/groups/group-members-section";
import { GroupSettlementsSection } from "@/components/groups/group-settlements-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { fetchJson } from "@/lib/query/fetch-json";
import { invalidateDomainQueries } from "@/lib/query/invalidate-domain-cache";
import { queryKeys } from "@/lib/query/query-keys";
import { publishSyncEvent } from "@/lib/query/sync-events";
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

const GROUPS_COLLABORATIVE_STALE_TIME = 15_000;

type GroupDetailWorkspaceProps = {
  currentUserId: string | null;
  initialGroup: GroupDetails;
  initialInviteCandidates: UserInviteCandidate[];
};

export function GroupDetailWorkspace({
  currentUserId: initialCurrentUserId,
  initialGroup,
  initialInviteCandidates
}: GroupDetailWorkspaceProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const syncSourceId = useSyncSourceId();
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageMessage, setPageMessage] = useState<string | null>(null);
  const [pendingAddMemberGroupId, setPendingAddMemberGroupId] = useState<string | null>(null);
  const [pendingCreateExpenseGroupId, setPendingCreateExpenseGroupId] = useState<string | null>(
    null
  );
  const [pendingDeleteGroupId, setPendingDeleteGroupId] = useState<string | null>(null);
  const [pendingRemoveMemberId, setPendingRemoveMemberId] = useState<string | null>(null);
  const [pendingSettleSplitId, setPendingSettleSplitId] = useState<string | null>(null);
  const [pendingAcceptSettlementId, setPendingAcceptSettlementId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [hasAttemptedMarkViewed, setHasAttemptedMarkViewed] = useState(false);
  const initialData = useMemo<GroupApiResponse>(
    () => ({
      currentUserId: initialCurrentUserId,
      group: initialGroup,
      inviteCandidates: initialInviteCandidates
    }),
    [initialCurrentUserId, initialGroup, initialInviteCandidates]
  );

  const groupQuery = useQuery({
    queryKey: queryKeys.groups.detail(initialGroup.group.id),
    queryFn: () =>
      fetchJson<GroupApiResponse>(`/api/groups/${initialGroup.group.id}`, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store"
      }),
    initialData,
    staleTime: GROUPS_COLLABORATIVE_STALE_TIME,
    refetchOnMount: "always",
    refetchOnWindowFocus: true
  });

  const groupData = groupQuery.data ?? initialData;
  const { currentUserId, group, inviteCandidates } = groupData;

  function setGroupUnreadFlag(nextHasUnreadExpenses: boolean) {
    queryClient.setQueryData<GroupApiResponse>(
      queryKeys.groups.detail(initialGroup.group.id),
      (previous) =>
        previous
          ? {
              ...previous,
              group: {
                ...previous.group,
                group: {
                  ...previous.group.group,
                  hasUnreadExpenses: nextHasUnreadExpenses
                }
              }
            }
          : previous
    );

    queryClient.setQueryData<{
      currentUserId: string | null;
      groups: GroupDetails[];
    }>(queryKeys.groups.all, (previous) =>
      previous
        ? {
            ...previous,
            groups: previous.groups.map((item) =>
              item.group.id === initialGroup.group.id
                ? {
                    ...item,
                    group: {
                      ...item.group,
                      hasUnreadExpenses: nextHasUnreadExpenses
                    }
                  }
                : item
            )
          }
        : previous
    );

    queryClient.setQueryData<{ hasUnreadGroups: boolean }>(
      queryKeys.groups.unreadSummary,
      (previous) => {
        const groupsCache = queryClient.getQueryData<{
          currentUserId: string | null;
          groups: GroupDetails[];
        }>(queryKeys.groups.all);

        if (!groupsCache) {
          return previous;
        }

        return {
          hasUnreadGroups: groupsCache.groups.some((item) => item.group.hasUnreadExpenses)
        };
      }
    );
  }

  const markViewedMutation = useMutation({
    mutationFn: async () =>
      fetchJson<{ success: boolean }>(`/api/groups/${initialGroup.group.id}/viewed`, {
        method: "POST",
        credentials: "same-origin"
      }),
    onMutate: async () => {
      setGroupUnreadFlag(false);
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({
        queryKey: queryKeys.groups.unreadSummary,
        type: "active"
      });

      publishSyncEvent({
        id: crypto.randomUUID(),
        domain: "groups",
        sourceId: syncSourceId,
        timestamp: Date.now()
      });
    },
    onError: () => {
      setGroupUnreadFlag(true);
    }
  });
  const isMarkViewedPending = markViewedMutation.isPending;
  const markGroupViewed = markViewedMutation.mutate;

  useEffect(() => {
    if (!group.group.hasUnreadExpenses && hasAttemptedMarkViewed && !isMarkViewedPending) {
      setHasAttemptedMarkViewed(false);
    }
  }, [group.group.hasUnreadExpenses, hasAttemptedMarkViewed, isMarkViewedPending]);

  async function syncGroupsDomain() {
    await invalidateDomainQueries(queryClient, "groups");
    await queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(group.group.id) });

    publishSyncEvent({
      id: crypto.randomUUID(),
      domain: "groups",
      sourceId: syncSourceId,
      timestamp: Date.now()
    });
  }

  useEffect(() => {
    if (
      !currentUserId ||
      !group.group.hasUnreadExpenses ||
      isMarkViewedPending ||
      hasAttemptedMarkViewed
    ) {
      return;
    }

    setHasAttemptedMarkViewed(true);
    markGroupViewed();
  }, [
    currentUserId,
    group.group.hasUnreadExpenses,
    hasAttemptedMarkViewed,
    isMarkViewedPending,
    markGroupViewed
  ]);

  async function handleAddMember(values: AddGroupMemberFormValues): Promise<GroupFormState> {
    setPendingAddMemberGroupId(values.groupId);
    setPageError(null);
    setPageMessage(null);

    try {
      await fetchJson<{ success: boolean }>(`/api/groups/${values.groupId}/members`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(values)
      });
      await syncGroupsDomain();
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
      await fetchJson<{ success: boolean }>(`/api/groups/${values.groupId}/expenses`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(values)
      });
      setGroupUnreadFlag(false);
      await syncGroupsDomain();
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

  async function handleRemoveMember(memberId: string): Promise<GroupFormState> {
    setPendingRemoveMemberId(memberId);
    setPageError(null);
    setPageMessage(null);

    try {
      await fetchJson<{ success?: boolean }>(`/api/groups/${group.group.id}/members/${memberId}`, {
        method: "DELETE",
        credentials: "same-origin"
      });
      await syncGroupsDomain();
      setPageMessage("Partecipante rimosso dal gruppo.");
      return { success: true, message: "Partecipante rimosso." };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Impossibile rimuovere il partecipante.";
      setPageError(message);
      return {
        success: false,
        message
      };
    } finally {
      setPendingRemoveMemberId(null);
    }
  }

  async function handleSettleSplit(values: SettleSplitFormValues): Promise<GroupFormState> {
    setPendingSettleSplitId(values.splitId);
    setPageError(null);
    setPageMessage(null);

    try {
      const data = await fetchJson<{ result: { status: "pending" | "completed" } }>(
        "/api/groups/settlements",
        {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(values)
        }
      );
      await syncGroupsDomain();
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
      await fetchJson<{ success: boolean }>(`/api/groups/settlements/${settlementId}/accept`, {
        method: "POST",
        credentials: "same-origin"
      });
      await syncGroupsDomain();
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
      await fetchJson<{ group: GroupType }>(`/api/groups/${group.group.id}`, {
        method: "DELETE",
        credentials: "same-origin"
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
      publishSyncEvent({
        id: crypto.randomUUID(),
        domain: "groups",
        sourceId: syncSourceId,
        timestamp: Date.now()
      });
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

        <div className="rounded-[2rem] border border-input bg-card p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {group.group.members.length} membri
                </Badge>
                <Badge variant="secondary">
                  {group.expenses.length} spese
                </Badge>
              </div>
              <div>
                <h1 className="font-display text-3xl font-semibold text-foreground">
                  {group.group.name}
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
                  {group.group.description || "Nessuna descrizione disponibile."}
                </p>
              </div>
            </div>

            {canDeleteGroup ? (
              <Button
                type="button"
                variant="outline"
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
        <div className="rounded-[1.5rem] bg-secondary px-5 py-4 text-sm text-foreground">
          {pageError}
        </div>
      ) : null}

      {groupQuery.error instanceof Error ? (
        <div className="rounded-[1.5rem] bg-secondary px-5 py-4 text-sm text-foreground">
          {groupQuery.error.message}
        </div>
      ) : null}

      {pageMessage ? (
        <div className="rounded-[1.5rem] bg-secondary px-5 py-4 text-sm text-foreground">
          {pageMessage}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <GroupMembersSection
            currentUserId={currentUserId}
            group={group}
            inviteCandidates={inviteCandidates}
            isSubmitting={pendingAddMemberGroupId === group.group.id}
            removingMemberId={pendingRemoveMemberId}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
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
            currentUserId={currentUserId}
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
        description="Il gruppo verra chiuso definitivamente: spese e rimborsi condivisi verranno rimossi, mentre le transazioni personali resteranno nel wallet senza collegamento al gruppo."
      >
        <div className="space-y-5">
          <div className="rounded-3xl border border-input bg-card px-5 py-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{group.group.name}</p>
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
