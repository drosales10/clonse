import { ClientShell } from "@/components/client/ClientShell";
import { PollDetailSkeleton } from "@/app/components/polls/poll-ui";

export default function PollDetailLoadingPage() {
  return (
    <ClientShell current="explore">
      <div className="polls-module"><PollDetailSkeleton /></div>
    </ClientShell>
  );
}
