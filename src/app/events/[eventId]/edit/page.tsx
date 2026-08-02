import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { EditEventForm } from "@/app/components/events/edit-event-form";
import { EventBreadcrumb } from "@/app/components/events/event-ui";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getEventDetail, listActiveEventCategories } from "@/server/events/service";

export const metadata: Metadata = { title: "Editar evento | nexo." };

export default async function EditEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?returnUrl=/events/${encodeURIComponent((await params).eventId)}/edit`);

  const { eventId } = await params;
  const [event, categories] = await Promise.all([
    getEventDetail(user.id, eventId),
    listActiveEventCategories(),
  ]);
  if (!event) notFound();
  if (!event.isOwner) redirect(`/events/${encodeURIComponent(eventId)}`);

  const cancelHref = `/events/${encodeURIComponent(eventId)}`;

  return (
    <ClientShell current="explore">
      <div className="events-module">
        <section className="events-page events-page-narrow">
          <EventBreadcrumb
            items={[
              { label: "Inicio", href: "/home" },
              { label: "Eventos", href: "/events" },
              { label: event.title, href: cancelHref },
              { label: "Editar" },
            ]}
          />
          <header className="events-page-header">
            <h1>Editar evento</h1>
            <p className="events-page-lead">Modifica fechas, ubicación, descripción y visibilidad del evento.</p>
          </header>
          <EditEventForm
            cancelHref={cancelHref}
            catalogVisible={event.catalogVisible}
            categories={categories}
            categoryId={event.categoryId}
            description={event.description}
            endsAt={event.endsAt}
            eventId={event.id}
            host={event.host}
            location={event.location}
            startsAt={event.startsAt}
            title={event.title}
          />
        </section>
      </div>
    </ClientShell>
  );
}
