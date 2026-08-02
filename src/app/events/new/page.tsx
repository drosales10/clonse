import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { EventCreateForm } from "@/app/components/event-create-form";
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
      <section className="profile-panel event-panel" aria-labelledby="new-event-title">
        <Link className="text-link event-back-link" href="/events">
          ← Volver a eventos
        </Link>
        <p className="eyebrow">Comunidad · Eventos</p>
        <h1 id="new-event-title">Nuevo evento</h1>
        <p className="lead">
          Publica un evento visible. Podrás editar fechas, ubicación y visibilidad desde el detalle.
        </p>
        <EventCreateForm categories={categories} />
      </section>
    </ClientShell>
  );
}
