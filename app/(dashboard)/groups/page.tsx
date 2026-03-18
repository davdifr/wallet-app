import { GroupsWorkspace } from "@/components/groups/groups-workspace";
import { NoticeCard } from "@/components/ui/notice-card";
import { getSupabasePageErrorMessage } from "@/lib/supabase/error-message";
import { getUser } from "@/services/auth/get-user";
import { listGroupsWithDetails } from "@/services/group-expenses/group-expenses-service";

export default async function GroupsPage() {
  try {
    const user = await getUser();
    const groups = await listGroupsWithDetails({ userId: user?.id ?? null });
    return <GroupsWorkspace initialGroups={groups} />;
  } catch (error) {
    return (
      <NoticeCard
        title="Sezione gruppi non disponibile"
        message={getSupabasePageErrorMessage(error)}
      />
    );
  }
}
