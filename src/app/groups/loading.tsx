import { ClientShell } from "@/components/client/ClientShell";
import { GroupCatalogSkeleton } from "@/app/components/groups/group-ui";

export default function GroupsLoadingPage() {
  return (
    <ClientShell current="explore">
      <div className="groups-module">
        <GroupCatalogSkeleton />
      </div>
    </ClientShell>
  );
}
