import type { Metadata } from "next";
import Link from "next/link";

import { PollGrid, PollPagination, PollToolbar } from "@/app/components/polls/poll-catalog";
import { PollEmptyState } from "@/app/components/polls/poll-ui";
import { normalizePollQuery, type PollSort } from "@domain/polls";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getPollCatalog } from "@/server/polls/service";

export const metadata: Metadata = {
  title: "Encuestas | nexo.",
  description: "Explora encuestas de la comunidad y participa con tu voto.",
};

export default async function PollsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sortRaw = readString(params.sort);
  const sort: PollSort = sortRaw === "votes" || sortRaw === "views" ? sortRaw : "created";
  const view = readString(params.view) === "list" ? "list" : "grid";
  const query = normalizePollQuery({ page: readNumber(params.page), sort });
  const viewer = await getCurrentUser();
  const canCreate = Boolean(viewer);
  const catalog = await getPollCatalog(viewer?.id ?? null, query);

  return (
    <ClientShell current="explore">
      <div className="polls-module">
        <section className="polls-page" aria-labelledby="polls-title" id="polls-catalog">
          <header className="polls-page-header">
            <nav aria-label="Ruta de navegación" className="polls-breadcrumb">
              <ol>
                <li><Link href="/home">Inicio</Link></li>
                <li><span aria-current="page">Encuestas</span></li>
              </ol>
            </nav>
            <div className="polls-page-heading">
              <div>
                <h1 id="polls-title">Encuestas</h1>
                <p className="polls-page-lead">
                  Explora preguntas de la comunidad. Un voto por persona; requiere sesión.
                </p>
              </div>
              {canCreate ? (
                <Link className="polls-btn polls-btn-primary" href="/polls/new">Crear encuesta</Link>
              ) : null}
            </div>
          </header>
          {!viewer ? (
            <aside className="polls-permission-notice" role="note">
              <p>Inicia sesión para crear encuestas y votar.</p>
              <Link className="polls-text-link" href="/login?returnUrl=/polls/new">Iniciar sesión</Link>
            </aside>
          ) : null}
          <PollToolbar canCreate={canCreate} sort={query.sort} total={catalog.pagination.total} view={view} />
          {catalog.items.length > 0 ? (
            <PollGrid polls={catalog.items} sort={query.sort} view={view} />
          ) : (
            <PollEmptyState
              action={canCreate ? <Link className="polls-btn polls-btn-primary" href="/polls/new">Crear tu primera encuesta</Link> : undefined}
              description="Cuando haya encuestas publicadas, las verás aquí."
              title="Todavía no hay encuestas para mostrar"
            />
          )}
          <PollPagination page={catalog.pagination.page} pageCount={catalog.pagination.pageCount} sort={query.sort} view={view} />
        </section>
      </div>
    </ClientShell>
  );
}

function readString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
function readNumber(value: string | string[] | undefined): number | undefined {
  const raw = readString(value);
  const number = Number(raw);
  return Number.isInteger(number) ? number : undefined;
}
