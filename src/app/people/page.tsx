import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import type {
  FriendRelationship,
  PeopleDirectoryItem,
  PeopleDirectoryPagination,
  PeopleDirectoryRelationFilter,
} from "@domain/friends";
import { isPeopleDirectoryRelationFilter } from "@domain/friends";
import { FriendRelationshipActions } from "@/app/components/friend-relationship-actions";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getPeopleDirectory } from "@/server/profile/service";

export const metadata: Metadata = {
  title: "Descubrir personas | nexo.",
  description: "Busca personas y gestiona tus conexiones.",
};

const relationFilters: { key: PeopleDirectoryRelationFilter; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "connect", label: "Por conectar" },
  { key: "pending", label: "Pendientes" },
  { key: "friends", label: "Conexiones" },
];

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; rel?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnUrl=/people");

  const params = await searchParams;
  const rawRelation = params.rel ?? "all";
  const relationFilter = isPeopleDirectoryRelationFilter(rawRelation) ? rawRelation : "all";
  const directory = await getPeopleDirectory(user.id, {
    search: params.q,
    page: parsePage(params.page),
    relationFilter,
  });

  const hasSearch = Boolean(directory.pagination.search);
  const emptyMessage = hasSearch
    ? `No hay coincidencias para “${directory.pagination.search}”.`
    : relationFilter === "pending"
      ? "No tienes solicitudes pendientes ahora mismo."
      : relationFilter === "friends"
        ? "Todavía no tienes conexiones visibles aquí."
        : relationFilter === "connect"
          ? "No hay personas nuevas por conectar con estos filtros."
          : "Aún no hay personas visibles para descubrir.";

  return (
    <ClientShell current="people">
      <section className="people-discover" aria-labelledby="people-title">
        <header className="people-hero">
          <div>
            <p className="eyebrow">Red · Descubrir</p>
            <h1 id="people-title">Personas</h1>
            <p className="lead">
              Encuentra perfiles activos, revisa quién está en línea y crea nuevas conexiones.
            </p>
          </div>
          <dl className="people-stats" aria-label="Resumen del directorio">
            <div>
              <dt>Visibles</dt>
              <dd>{directory.pagination.total}</dd>
            </div>
            <div>
              <dt>En línea</dt>
              <dd>{directory.pagination.onlineCount}</dd>
            </div>
          </dl>
        </header>

        <form className="people-search" method="get" role="search">
          <label className="visually-hidden" htmlFor="people-search-input">
            Buscar personas
          </label>
          <div className="people-search-bar">
            <span className="people-search-icon" aria-hidden="true">
              <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
              </svg>
            </span>
            <input
              autoComplete="off"
              defaultValue={directory.pagination.search}
              id="people-search-input"
              maxLength={64}
              name="q"
              placeholder="Buscar por nombre o usuario"
              type="search"
            />
            {relationFilter !== "all" ? (
              <input name="rel" type="hidden" value={relationFilter} />
            ) : null}
            <button className="button button-primary button-small" type="submit">
              Buscar
            </button>
            {hasSearch ? (
              <Link
                className="button button-quiet people-clear"
                href={peopleHref({ rel: relationFilter === "all" ? undefined : relationFilter })}
              >
                Limpiar
              </Link>
            ) : null}
          </div>
        </form>

        <nav className="people-filters" aria-label="Filtrar por relación">
          {relationFilters.map((filter) => {
            const active = directory.pagination.relationFilter === filter.key;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={active ? "people-filter people-filter-active" : "people-filter"}
                href={peopleHref({
                  q: directory.pagination.search || undefined,
                  rel: filter.key === "all" ? undefined : filter.key,
                })}
                key={filter.key}
              >
                {filter.label}
              </Link>
            );
          })}
        </nav>

        {directory.items.length > 0 ? (
          <div className="people-list">
            {directory.items.map((person) => (
              <PersonCard key={person.username} person={person} />
            ))}
          </div>
        ) : (
          <div className="people-empty">
            <p className="empty-state">{emptyMessage}</p>
            {hasSearch || relationFilter !== "all" ? (
              <Link className="button button-small" href="/people">
                Ver todas las personas
              </Link>
            ) : (
              <Link className="text-link" href="/account/friends">
                Ir a mis conexiones →
              </Link>
            )}
          </div>
        )}

        <PeoplePagination pagination={directory.pagination} />
      </section>
    </ClientShell>
  );
}

function PersonCard({ person }: { person: PeopleDirectoryItem }) {
  const tone = avatarTone(person.username);
  return (
    <article className="person-card">
      <Link className="person-card-main" href={`/profile/${encodeURIComponent(person.username)}`}>
        <span className={`friend-avatar person-avatar tone-${tone}`} aria-hidden="true">
          {person.displayName.slice(0, 1).toUpperCase()}
          {person.presence === "online" ? <i className="person-online-dot" /> : null}
        </span>
        <span className="person-card-copy">
          <span className="person-card-heading">
            <strong>{person.displayName}</strong>
            <span className={`person-rel-badge rel-${person.relationship}`}>
              {relationshipLabel(person.relationship)}
            </span>
          </span>
          <small>@{person.username}</small>
          {person.status ? <p className="person-status">{person.status}</p> : null}
          <span className={`presence-status presence-${person.presence}`}>
            <span aria-hidden="true" />
            {person.presence === "online" ? "En línea" : "Desconectado"}
          </span>
        </span>
      </Link>
      <div className="person-card-actions">
        <Link className="text-link" href={`/profile/${encodeURIComponent(person.username)}`}>
          Ver perfil
        </Link>
        <FriendRelationshipActions relationship={person.relationship} username={person.username} />
      </div>
    </article>
  );
}

function PeoplePagination({ pagination }: { pagination: PeopleDirectoryPagination }) {
  if (pagination.pageCount <= 1 && !pagination.search && pagination.relationFilter === "all") return null;

  return (
    <nav aria-label="Paginación de personas" className="people-pagination">
      {pagination.page > 1 ? (
        <Link
          className="text-link"
          href={peopleHref({
            q: pagination.search || undefined,
            rel: pagination.relationFilter === "all" ? undefined : pagination.relationFilter,
            page: pagination.page - 1,
          })}
        >
          Anteriores
        </Link>
      ) : (
        <span aria-disabled="true">Anteriores</span>
      )}
      <span aria-current="page">
        {pagination.total === 0
          ? "0 resultados"
          : `${pagination.start}–${pagination.end} de ${pagination.total}`}
      </span>
      {pagination.page < pagination.pageCount ? (
        <Link
          className="text-link"
          href={peopleHref({
            q: pagination.search || undefined,
            rel: pagination.relationFilter === "all" ? undefined : pagination.relationFilter,
            page: pagination.page + 1,
          })}
        >
          Siguientes
        </Link>
      ) : (
        <span aria-disabled="true">Siguientes</span>
      )}
    </nav>
  );
}

function peopleHref(input: {
  q?: string;
  rel?: PeopleDirectoryRelationFilter;
  page?: number;
}): string {
  const params = new URLSearchParams();
  if (input.q) params.set("q", input.q);
  if (input.rel && input.rel !== "all") params.set("rel", input.rel);
  if (input.page && input.page > 1) params.set("page", String(input.page));
  const query = params.toString();
  return `/people${query ? `?${query}` : ""}#people-title`;
}

function relationshipLabel(relationship: Exclude<FriendRelationship, "self">): string {
  if (relationship === "friends") return "Conexión";
  if (relationship === "incoming_pending") return "Te envió solicitud";
  if (relationship === "outgoing_pending") return "Solicitud enviada";
  return "Nueva";
}

function avatarTone(username: string): number {
  let hash = 0;
  for (let index = 0; index < username.length; index += 1) {
    hash = (hash + username.charCodeAt(index) * (index + 1)) % 5;
  }
  return hash;
}

function parsePage(value: string | undefined): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
