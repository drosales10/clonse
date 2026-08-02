import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PollCreateForm } from "@/app/components/poll-create-form";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";

export const metadata: Metadata = {
  title: "Nueva encuesta | nexo.",
  description: "Crea una encuesta para la comunidad.",
};

export default async function NewPollPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnUrl=/polls/new");

  return (
    <ClientShell current="explore">
      <section className="profile-panel poll-panel" aria-labelledby="new-poll-title">
        <Link className="text-link poll-back-link" href="/polls">
          ← Volver a encuestas
        </Link>
        <p className="eyebrow">Comunidad · Encuestas</p>
        <h1 id="new-poll-title">Nueva encuesta</h1>
        <p className="lead">
          Publica una pregunta con opciones. Quedará visible en el catálogo y aceptará un voto por
          persona.
        </p>
        <PollCreateForm />
      </section>
    </ClientShell>
  );
}
