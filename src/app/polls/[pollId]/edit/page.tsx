import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { EditPollForm } from "@/app/components/polls/edit-poll-form";
import { PollBreadcrumb } from "@/app/components/polls/poll-ui";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getPollDetail } from "@/server/polls/service";

export const metadata: Metadata = { title: "Editar encuesta | nexo." };

export default async function EditPollPage({ params }: { params: Promise<{ pollId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?returnUrl=/polls/${encodeURIComponent((await params).pollId)}/edit`);

  const { pollId } = await params;
  const poll = await getPollDetail(user.id, pollId);
  if (!poll) notFound();
  if (!poll.isOwner) redirect(`/polls/${encodeURIComponent(pollId)}`);

  const cancelHref = `/polls/${encodeURIComponent(pollId)}`;

  return (
    <ClientShell current="explore">
      <div className="polls-module">
        <section className="polls-page polls-page-narrow">
          <PollBreadcrumb items={[{ label: "Inicio", href: "/home" }, { label: "Encuestas", href: "/polls" }, { label: poll.title, href: cancelHref }, { label: "Editar" }]} />
          <header className="polls-page-header">
            <h1>Editar encuesta</h1>
            <p className="polls-page-lead">Modifica la pregunta, opciones, visibilidad o cierra la encuesta.</p>
          </header>
          <EditPollForm
            cancelHref={cancelHref}
            catalogVisible={poll.catalogVisible}
            closed={poll.closed}
            description={poll.description}
            optionLabels={poll.options.map((o) => o.label)}
            pollId={poll.id}
            title={poll.title}
            totalVotes={poll.totalVotes}
          />
        </section>
      </div>
    </ClientShell>
  );
}
