import { ClientShell } from "@/components/client/ClientShell";
import { EventCatalogSkeleton } from "@/app/components/events/event-ui";

export default function EventsLoadingPage() {
  return (
    <ClientShell current="explore">
      <div className="events-module">
        <EventCatalogSkeleton />
      </div>
    </ClientShell>
  );
}
