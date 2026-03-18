"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { useGroupExpensesRealtimeSync } from "@/components/groups/use-group-expenses-realtime-sync";
import { useSyncSourceId } from "@/components/providers/dashboard-query-provider";
import { GroupsList } from "@/components/groups/groups-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { fetchJson } from "@/lib/query/fetch-json";
import { invalidateDomainQueries } from "@/lib/query/invalidate-domain-cache";
import { queryKeys } from "@/lib/query/query-keys";
import { publishSyncEvent } from "@/lib/query/sync-events";
import type { CreateGroupFormValues, GroupDetails, GroupFormState } from "@/types/group-expenses";

const CreateGroupForm = dynamic(
  () => import("@/components/groups/create-group-form").then((mod) => mod.CreateGroupForm)
);

type GroupsApiResponse = {
  currentUserId: string | null;
  groups: GroupDetails[];
};

const GROUPS_COLLABORATIVE_STALE_TIME = 15_000;

type GroupsWorkspaceProps = {
  initialGroups: GroupDetails[];
};

export function GroupsWorkspace({ initialGroups }: GroupsWorkspaceProps) {
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageMessage, setPageMessage] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const syncSourceId = useSyncSourceId();
  const initialData = useMemo(
    () => ({ currentUserId: null, groups: initialGroups }),
    [initialGroups]
  );

  useGroupExpensesRealtimeSync();

  const groupsQuery = useQuery({
    queryKey: queryKeys.groups.all,
    queryFn: () =>
      fetchJson<GroupsApiResponse>("/api/groups", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store"
      }),
    initialData,
    staleTime: GROUPS_COLLABORATIVE_STALE_TIME,
    refetchOnMount: "always",
    refetchOnWindowFocus: true
  });

  const createGroupMutation = useMutation({
    mutationFn: async (values: CreateGroupFormValues) =>
      fetchJson<{ success: boolean }>("/api/groups", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      })
  });

  async function syncGroupsDomain() {
    await invalidateDomainQueries(queryClient, "groups");
    publishSyncEvent({
      id: crypto.randomUUID(),
      domain: "groups",
      sourceId: syncSourceId,
      timestamp: Date.now()
    });
  }

  async function handleCreateGroup(values: CreateGroupFormValues): Promise<GroupFormState> {
    setPageError(null);
    setPageMessage(null);

    try {
      await createGroupMutation.mutateAsync(values);
      setIsCreateModalOpen(false);
      await syncGroupsDomain();

      return {
        success: true,
        message: "Gruppo creato."
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Impossibile creare il gruppo."
      };
    }
  }

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
                Gruppi
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
                Qui trovi solo l&apos;elenco dei gruppi. Apri un gruppo per gestire spese,
                partecipanti, saldi e rimborsi nel suo spazio dedicato.
              </p>
            </div>
          </div>

          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => setIsCreateModalOpen(true)}
          >
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

      {groupsQuery.error instanceof Error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {groupsQuery.error.message}
        </div>
      ) : null}

      {pageMessage ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
          {pageMessage}
        </div>
      ) : null}

      <section>
        <GroupsList groups={groupsQuery.data?.groups ?? initialData.groups} />
      </section>

      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Nuovo gruppo"
        description="Crea un gruppo e poi aprilo per aggiungere membri, spese e rimborsi."
      >
        <CreateGroupForm
          isSubmitting={createGroupMutation.isPending}
          onSubmit={handleCreateGroup}
        />
      </Modal>
    </div>
  );
}
