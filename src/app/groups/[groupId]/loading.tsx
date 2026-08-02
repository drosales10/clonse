import { ClientShell } from "@/components/client/ClientShell";
import { GroupDetailSkeleton } from "@/app/components/groups/group-ui";

export default function GroupDetailLoadingPage() {
  return (
    <ClientShell current="explore">
      <div className="groups-module">
        <GroupDetailSkeleton />
      </div>
    </ClientShell>
  );
}
