import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import type { FriendRelationship, PeopleDirectoryPagination } from "@domain/friends";
import { FriendRelationshipActions } from "@/app/components/friend-relationship-actions";
import { getCurrentUser } from "@/server/auth/session";
import { getPeopleDirectory } from "@/server/profile/service";

export const metadata: Metadata = {
  title: "Descubrir personas | Red Social",
  description: "Busca personas y gestiona tus conexiones.",
};

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnUrl=/people");

  const params = await searchParams;
  const directory = await getPeopleDirectory(user.id, {
    search: params.q,
    page: parsePage(params.page),
  });

  return (
    <main className="authenticated-shell">
      <header className="app-header">
        <Link className="brand" href="/">nexo<span>.</span></Link>
        <nav className="profile-navigation" aria-label="Navegación de cuenta">
          <Link className="text-link" href="/home">Inicio</Link>
          <Link className="text-link" href={`/profile/${encodeURIComponent(user.username)}`}>Mi perfil</Link>
          <Link className="text-link" href="/account/friends">Conexiones</Link>
          <Link className="text-link" href="/account/profile">Ajustes</Link>
        </nav>
      </header>

      <section className="profile-panel people-panel" aria-labelledby="people-title">
        <p className="eyebrow">Red · Descubrir</p>
        <h1 id="people-title">Encuentra personas</h1>
        <p className="lead">Busca por nombre o usuario. Solo aparecen perfiles activos que puedes ver.</p>

        <form className="people-search" method="get">
          <label htmlFor="people-search-input">Buscar personas</label>
          <div>
            <input id="people-search-input" name="q" defaultValue={directory.pagination.search} maxLength={64} placeholder="Nombre o usuario" />
            <button className="button button-primary button-small" type="submit">Buscar</button>
          </div>
        </form>

        {directory.items.length > 0 ? (
          <div className="people-list">
            {directory.items.map((person) => <PersonCard key={person.username} person={person} />)}
          </div>
        ) : (
          <p className="empty-state">No encontramos personas visibles con esa búsqueda.</p>
        )}
        <PeoplePagination pagination={directory.pagination} />
      </section>
    </main>
  );
}

function PersonCard({ person }: { person: { username: string; displayName: string; relationship: Exclude<FriendRelationship, "self"> } }) {
  return (
    <article className="person-card">
      <Link className="friend-card-identity" href={`/profile/${encodeURIComponent(person.username)}`}>
        <span className="friend-avatar" aria-hidden="true">{person.displayName.slice(0, 1).toUpperCase()}</span>
        <span><strong>{person.displayName}</strong><small>@{person.username}</small></span>
      </Link>
      <FriendRelationshipActions relationship={person.relationship} username={person.username} />
    </article>
  );
}

function PeoplePagination({ pagination }: { pagination: PeopleDirectoryPagination }) {
  if (pagination.pageCount <= 1 && !pagination.search) return null;
  const pageLink = (page: number): string => {
    const params = new URLSearchParams();
    if (pagination.search) params.set("q", pagination.search);
    if (page > 1) params.set("page", String(page));
    const query = params.toString();
    return `/people${query ? `?${query}` : ""}#people-title`;
  };
  return (
    <nav aria-label="Paginación de personas" className="people-pagination">
      {pagination.page > 1 ? <Link className="text-link" href={pageLink(pagination.page - 1)}>Anteriores</Link> : <span aria-disabled="true">Anteriores</span>}
      <span aria-current="page">{pagination.start}-{pagination.end} de {pagination.total}</span>
      {pagination.page < pagination.pageCount ? <Link className="text-link" href={pageLink(pagination.page + 1)}>Siguientes</Link> : <span aria-disabled="true">Siguientes</span>}
    </nav>
  );
}

function parsePage(value: string | undefined): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
