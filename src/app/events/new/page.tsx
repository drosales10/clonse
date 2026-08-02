import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CreateEventForm } from "@/app/components/events/create-event-form";
import { EventBreadcrumb } from "@/app/components/events/event-ui";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { listActiveEventCategories } from "@/server/events/service";

export const metadata: Metadata = {
  title: "Nuevo evento | nexo.",
  description: "Crea un evento para la comunidad.",
};

export default async function NewEventPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnUrl=/events/new");

  const categories = await listActiveEventCategories();

  return (
    <ClientShell current="explore">
      <div className="events-module">
        <section className="events-page events-page-narrow">
          <EventBreadcrumb
            items={[
              { label: "Inicio", href: "/home" },
              { label: "Eventos", href: "/events" },
              { label: "Nuevo evento" },
            ]}
          />
          <header className="events-page-header">
            <h1>Nuevo evento</h1>
            <p className="events-page-lead">
              Publica un evento con fechas, lugar y categoría. Podrás editarlo y gestionar asistentes desde el detalle.
            </p>
          </header>
          <CreateEventForm categories={categories} />
        </section>
      </div>
    </ClientShell>
  );
}
