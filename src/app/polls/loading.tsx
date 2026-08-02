import { ClientShell } from "@/components/client/ClientShell";
import { PollCatalogSkeleton } from "@/app/components/polls/poll-ui";

export default function PollsLoadingPage() {
  return (
    <ClientShell current="explore">
      <div className="polls-module"><PollCatalogSkeleton /></div>
    </ClientShell>
  );
}
