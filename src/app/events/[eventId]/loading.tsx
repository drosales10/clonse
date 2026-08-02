import { ClientShell } from "@/components/client/ClientShell";
import { EventDetailSkeleton } from "@/app/components/events/event-ui";

export default function EventDetailLoadingPage() {
  return (
    <ClientShell current="explore">
      <div className="events-module">
        <EventDetailSkeleton />
      </div>
    </ClientShell>
  );
}
