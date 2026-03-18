import { GroupsWorkspace } from "@/components/groups/groups-workspace";
import { NoticeCard } from "@/components/ui/notice-card";
import { getSupabasePageErrorMessage } from "@/lib/supabase/error-message";
import { listGroupsWithDetails } from "@/services/group-expenses/group-expenses-service";

export default async function GroupsPage() {
  try {
    const groups = await listGroupsWithDetails();
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
