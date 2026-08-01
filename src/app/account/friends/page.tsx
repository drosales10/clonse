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

export default async function FriendsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnUrl=/account/friends");

  const dashboard = await getFriendDashboard(user.id);

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

        <FriendSection title="Solicitudes recibidas" count={dashboard.incomingRequests.length}>
          {dashboard.incomingRequests.map((friend) => (
            <FriendCard friend={friend} key={friend.username} relationship="incoming_pending" />
          ))}
        </FriendSection>

        <FriendSection title="Solicitudes enviadas" count={dashboard.outgoingRequests.length}>
          {dashboard.outgoingRequests.map((friend) => (
            <FriendCard friend={friend} key={friend.username} relationship="outgoing_pending" />
          ))}
        </FriendSection>

        <FriendSection title="Conexiones confirmadas" count={dashboard.friends.length}>
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
  title,
}: {
  children: React.ReactNode;
  count: number;
  title: string;
}) {
  return (
    <section className="friends-section" aria-labelledby={`${title}-heading`}>
      <div className="friends-section-heading">
        <h2 id={`${title}-heading`}>{title}</h2>
        <span>{count}</span>
      </div>
      {count > 0 ? <div className="friends-list">{children}</div> : <p className="empty-state">No hay elementos en esta sección.</p>}
    </section>
  );
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
