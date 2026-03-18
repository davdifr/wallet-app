import { notFound } from "next/navigation";

import { GroupDetailWorkspace } from "@/components/groups/group-detail-workspace";
import { NoticeCard } from "@/components/ui/notice-card";
import { getSupabasePageErrorMessage } from "@/lib/supabase/error-message";
import { getUser } from "@/services/auth/get-user";
import {
  getGroupWithDetails,
  listUserInviteCandidates
} from "@/services/group-expenses/group-expenses-service";

type GroupDetailPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function GroupDetailPage({ params }: GroupDetailPageProps) {
  const { groupId } = await params;
  const user = await getUser();
  let group = null;
  let inviteCandidates = [];

  try {
    [group, inviteCandidates] = await Promise.all([
      getGroupWithDetails(groupId),
      listUserInviteCandidates()
    ]);
  } catch (error) {
    return (
      <NoticeCard
        title="Dettaglio gruppo non disponibile"
        message={getSupabasePageErrorMessage(error)}
      />
    );
  }

  if (!group) {
    notFound();
  }

  return (
    <GroupDetailWorkspace
      currentUserId={user?.id ?? null}
      initialGroup={group}
      initialInviteCandidates={inviteCandidates}
    />
  );
}
