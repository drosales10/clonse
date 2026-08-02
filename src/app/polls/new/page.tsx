import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CreatePollForm } from "@/app/components/polls/create-poll-form";
import { PollBreadcrumb } from "@/app/components/polls/poll-ui";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";

export const metadata: Metadata = {
  title: "Nueva encuesta | nexo.",
};

export default async function NewPollPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnUrl=/polls/new");

  return (
    <ClientShell current="explore">
      <div className="polls-module">
        <section className="polls-page polls-page-narrow" aria-labelledby="new-poll-title">
          <PollBreadcrumb items={[{ label: "Inicio", href: "/home" }, { label: "Encuestas", href: "/polls" }, { label: "Crear encuesta" }]} />
          <header className="polls-page-header">
            <h1 id="new-poll-title">Crear encuesta</h1>
            <p className="polls-page-lead">Publica una pregunta con opciones. Podrás cerrarla o editarla después.</p>
          </header>
          <CreatePollForm />
        </section>
      </div>
    </ClientShell>
  );
}
