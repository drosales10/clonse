import type { FriendListPagination } from "@domain/friends";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { FriendRelationshipActions } from "@/app/components/friend-relationship-actions";
import { getCurrentUser } from "@/server/auth/session";
import { getFriendDashboard } from "@/server/profile/service";

export const metadata: Metadata = {
  title: "Conexiones | Red Social",
  description: "Gestiona tus conexiones y solicitudes.",
};

export default async function FriendsPage({
  searchParams,
}: {
  searchParams: Promise<{ friendsPage?: string; friendsSearch?: string; incomingPage?: string; outgoingPage?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnUrl=/account/friends");

  const params = await searchParams;
  const dashboard = await getFriendDashboard(user.id, {
    friendsPage: parsePage(params.friendsPage),
    incomingPage: parsePage(params.incomingPage),
    outgoingPage: parsePage(params.outgoingPage),
    search: params.friendsSearch,
  });

  return (
    <main className="authenticated-shell">
      <header className="app-header">
        <Link className="brand" href="/">nexo<span>.</span></Link>
        <nav className="profile-navigation" aria-label="Navegación de cuenta">
          <Link className="text-link" href="/home">Inicio</Link>
          <Link className="text-link" href={`/profile/${encodeURIComponent(user.username)}`}>Mi perfil</Link>
          <Link className="text-link" href="/account/profile">Ajustes</Link>
        </nav>
      </header>

      <section className="profile-panel friends-panel" aria-labelledby="friends-title">
        <p className="eyebrow">Cuenta · Red</p>
        <h1 id="friends-title">Tus conexiones</h1>
        <p className="lead">Administra tus conexiones confirmadas y las solicitudes pendientes.</p>

        <FriendSection title="Solicitudes recibidas" count={dashboard.incomingPagination.total} pagination={dashboard.incomingPagination} pageParam="incomingPage">
          {dashboard.incomingRequests.map((friend) => (
            <FriendCard friend={friend} key={friend.username} relationship="incoming_pending" />
          ))}
        </FriendSection>

        <FriendSection title="Solicitudes enviadas" count={dashboard.outgoingPagination.total} pagination={dashboard.outgoingPagination} pageParam="outgoingPage">
          {dashboard.outgoingRequests.map((friend) => (
            <FriendCard friend={friend} key={friend.username} relationship="outgoing_pending" />
          ))}
        </FriendSection>

        <FriendSection title="Conexiones confirmadas" count={dashboard.friendsPagination.total} pagination={dashboard.friendsPagination} pageParam="friendsPage" searchable search={dashboard.friendsPagination.search}>
          {dashboard.friends.map((friend) => (
            <FriendCard friend={friend} key={friend.username} relationship="friends" />
          ))}
        </FriendSection>
      </section>
    </main>
  );
}

function FriendSection({
  children,
  count,
  pageParam,
  pagination,
  search,
  searchable = false,
  title,
}: {
  children: React.ReactNode;
  count: number;
  pageParam: "friendsPage" | "incomingPage" | "outgoingPage";
  pagination: FriendListPagination;
  search?: string;
  searchable?: boolean;
  title: string;
}) {
  return (
    <section className="friends-section" aria-labelledby={`${title}-heading`}>
      <div className="friends-section-heading">
        <h2 id={`${title}-heading`}>{title}</h2>
        <span>{count}</span>
      </div>
      {searchable ? <form className="friends-search" method="get">
        <label htmlFor="friends-search-input">Buscar conexiones</label>
        <div><input id="friends-search-input" name="friendsSearch" defaultValue={search} maxLength={64} placeholder="Nombre o usuario" /><button className="button button-primary button-small" type="submit">Buscar</button></div>
      </form> : null}
      {count > 0 ? <div className="friends-list">{children}</div> : <p className="empty-state">No hay elementos en esta sección.</p>}
      <FriendPagination pageParam={pageParam} pagination={pagination} search={search} />
    </section>
  );
}

function FriendPagination({ pageParam, pagination, search }: { pageParam: "friendsPage" | "incomingPage" | "outgoingPage"; pagination: FriendListPagination; search?: string }) {
  if (pagination.pageCount <= 1 && !search) return null;
  const pageLink = (page: number): string => {
    const params = new URLSearchParams();
    if (page > 1) params.set(pageParam, String(page));
    if (search) params.set("friendsSearch", search);
    const query = params.toString();
    return `/account/friends${query ? `?${query}` : ""}#${pageParam}`;
  };
  return (
    <nav aria-label={`Paginación de ${pageParam}`} className="friends-pagination">
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

function FriendCard({
  friend,
  relationship,
}: {
  friend: { username: string; displayName: string };
  relationship: "friends" | "incoming_pending" | "outgoing_pending";
}) {
  return (
    <article className="friend-card">
      <Link className="friend-card-identity" href={`/profile/${encodeURIComponent(friend.username)}`}>
        <span className="friend-avatar" aria-hidden="true">{friend.displayName.slice(0, 1).toUpperCase()}</span>
        <span><strong>{friend.displayName}</strong><small>@{friend.username}</small></span>
      </Link>
      <FriendRelationshipActions relationship={relationship} username={friend.username} />
    </article>
  );
}
