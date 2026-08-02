import Link from "next/link";

import type { PublicPollDetail } from "@domain/polls";

import { PollBreadcrumb } from "@/app/components/polls/poll-ui";
import { formatPollDateTime, ownerInitials } from "@/app/components/polls/utils";

export function PollHeader({ poll }: { poll: PublicPollDetail }) {
  return (
    <header className="polls-detail-header">
      <PollBreadcrumb
        items={[
          { label: "Inicio", href: "/home" },
          { label: "Encuestas", href: "/polls" },
          { label: poll.title },
        ]}
      />
      <div className="polls-detail-heading">
        <div>
          <span className={poll.closed ? "polls-status polls-status-closed" : "polls-status polls-status-open"}>
            {poll.closed ? "Cerrada" : "Abierta"}
          </span>
          <h1>{poll.title}</h1>
          {poll.description ? (
            <p className="polls-detail-description">{poll.description}</p>
          ) : (
            <p className="polls-detail-description polls-detail-description-muted">Sin descripción.</p>
          )}
        </div>
        <div className="polls-detail-actions">
          <Link className="polls-btn polls-btn-secondary" href="/polls">
            Volver a Encuestas
          </Link>
          {poll.isOwner ? (
            <Link className="polls-btn polls-btn-primary" href={`/polls/${encodeURIComponent(poll.id)}/edit`}>
              Editar encuesta
            </Link>
          ) : null}
        </div>
      </div>
      <div className="polls-detail-owner">
        <span aria-hidden="true" className="polls-avatar polls-avatar-lg">
          {ownerInitials(poll.owner.displayName)}
        </span>
        <div>
          <Link href={`/profile/${encodeURIComponent(poll.owner.username)}`}>{poll.owner.displayName}</Link>
          <p>@{poll.owner.username}</p>
        </div>
      </div>
      <dl className="polls-detail-facts">
        <div>
          <dt>Creada</dt>
          <dd>
            <time dateTime={poll.createdAt.toISOString()}>{formatPollDateTime(poll.createdAt)}</time>
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
        <div>
          <dt>Opciones</dt>
          <dd>{poll.options.length}</dd>
        </div>
      </dl>
    </header>
  );
}

export function PollResults({ poll }: { poll: PublicPollDetail }) {
  return (
    <section aria-labelledby="poll-results-title" className="polls-results-section">
      <h2 id="poll-results-title">Resultados</h2>
      <ul className="polls-result-list">
        {poll.options.map((option) => (
          <li key={option.index}>
            <div className="polls-result-meta">
              <strong>{option.label}</strong>
              <span>
                {option.votes} votos · {option.percent}%
              </span>
            </div>
            <div aria-hidden="true" className="polls-result-bar">
              <span style={{ width: `${option.percent}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
