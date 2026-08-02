import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PollOwnerControls } from "@/app/components/poll-owner-controls";
import { PollVoteForm } from "@/app/components/poll-vote-form";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getPollDetail } from "@/server/polls/service";

export const metadata: Metadata = {
  title: "Encuesta | nexo.",
  description: "Consulta y vota una encuesta de la comunidad.",
};

export default async function PollDetailPage({
  params,
}: {
  params: Promise<{ pollId: string }>;
}) {
  const { pollId } = await params;
  const viewer = await getCurrentUser();
  const poll = await getPollDetail(viewer?.id ?? null, pollId);
  if (!poll) notFound();

  return (
    <ClientShell current="explore">
      <article className="profile-panel poll-detail-panel" aria-labelledby="poll-title">
        <Link className="text-link poll-back-link" href="/polls">
          ← Volver a encuestas
        </Link>
        <p className="eyebrow">{poll.closed ? "Encuesta cerrada" : "Encuesta abierta"}</p>
        <h1 id="poll-title">{poll.title}</h1>
        {poll.description ? (
          <div className="poll-detail-description">{poll.description}</div>
        ) : null}

        <dl className="poll-detail-facts">
          <div>
            <dt>Autor</dt>
            <dd>
              <Link href={`/profile/${encodeURIComponent(poll.owner.username)}`}>
                {poll.owner.displayName}
              </Link>
            </dd>
          </div>
          <div>
            <dt>Creada</dt>
            <dd>
              <time dateTime={poll.createdAt.toISOString()}>{formatDate(poll.createdAt)}</time>
            </dd>
          </div>
          <div>
            <dt>Votos</dt>
            <dd>{poll.totalVotes}</dd>
          </div>
          <div>
            <dt>Visitas</dt>
            <dd>{poll.views}</dd>
          </div>
        </dl>

        {poll.isOwner ? <PollOwnerControls closed={poll.closed} pollId={poll.id} /> : null}

        <section className="poll-results" aria-labelledby="poll-results-title">
          <h2 id="poll-results-title">Resultados</h2>
          <ul className="poll-result-list">
            {poll.options.map((option) => (
              <li key={option.index}>
                <div className="poll-result-meta">
                  <strong>{option.label}</strong>
                  <span>
                    {option.votes} · {option.percent}%
                  </span>
                </div>
                <div className="poll-result-bar" aria-hidden="true">
                  <span style={{ width: `${option.percent}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="poll-vote-section" aria-labelledby="poll-vote-title">
          <h2 id="poll-vote-title">Tu voto</h2>
          <PollVoteForm poll={poll} />
        </section>
      </article>
    </ClientShell>
  );
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(value);
}
