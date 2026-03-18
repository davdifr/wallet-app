"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { CreateGroupForm } from "@/components/groups/create-group-form";
import { GroupsList } from "@/components/groups/groups-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { CreateGroupFormValues, GroupDetails, GroupFormState } from "@/types/group-expenses";

type GroupsApiResponse = {
  groups: GroupDetails[];
};

type GroupsWorkspaceProps = {
  initialGroups: GroupDetails[];
};

async function readResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { message?: string };

  if (!response.ok) {
    throw new Error(data.message ?? "Richiesta non riuscita.");
  }

  return data;
}

export function GroupsWorkspace({ initialGroups }: GroupsWorkspaceProps) {
  const [groups, setGroups] = useState(initialGroups);
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageMessage, setPageMessage] = useState<string | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  async function reloadGroups() {
    const response = await fetch("/api/groups", {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      cache: "no-store"
    });

    const data = await readResponse<GroupsApiResponse>(response);
    setGroups(data.groups);
  }

  async function handleCreateGroup(values: CreateGroupFormValues): Promise<GroupFormState> {
    setIsCreatingGroup(true);
    setPageError(null);
    setPageMessage(null);

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
      await reloadGroups();
      setIsCreateModalOpen(false);

      return {
        success: true,
        message: "Gruppo creato."
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Impossibile creare il gruppo."
      };
    } finally {
      setIsCreatingGroup(false);
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

      {pageMessage ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
          {pageMessage}
        </div>
      ) : null}

      <section>
        <GroupsList groups={groups} />
      </section>

      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Nuovo gruppo"
        description="Crea un gruppo e poi aprilo per aggiungere membri, spese e rimborsi."
      >
        <CreateGroupForm isSubmitting={isCreatingGroup} onSubmit={handleCreateGroup} />
      </Modal>
    </div>
  );
}
