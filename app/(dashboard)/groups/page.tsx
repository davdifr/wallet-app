import { GroupsWorkspace } from "@/components/groups/groups-workspace";
import { NoticeCard } from "@/components/ui/notice-card";
import { getSupabasePageErrorMessage } from "@/lib/supabase/error-message";
import { getUser } from "@/services/auth/get-user";
import {
  listGroupsWithDetails,
  listUserInviteCandidates
} from "@/services/group-expenses/group-expenses-service";

export default async function GroupsPage() {
  const user = await getUser();

  try {
    const [groups, inviteCandidates] = await Promise.all([
      listGroupsWithDetails(),
      listUserInviteCandidates()
    ]);

    return (
      <GroupsWorkspace
        currentUserId={user?.id ?? null}
        initialGroups={groups}
        initialInviteCandidates={inviteCandidates}
      />
    );
  } catch (error) {
    return (
      <NoticeCard
        title="Sezione gruppi non disponibile"
        message={getSupabasePageErrorMessage(error)}
      />
    );
  }
}
