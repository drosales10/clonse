import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FriendRelationshipActions } from "@/app/components/friend-relationship-actions";
import { ProfileBlockActions } from "@/app/components/profile-block-actions";
import { ProfileComments } from "@/app/components/profile-comments";
import { ProfileFriends } from "@/app/components/profile-friends";
import { getCurrentUser } from "@/server/auth/session";
import { clearProfileCommentNotifications } from "@/server/notifications/service";
import { getPublicProfile } from "@/server/profile/service";

export const metadata: Metadata = {
  title: "Perfil | Red Social",
  description: "Consulta un perfil de la red social.",
};

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ commentsPage?: string; friendsPage?: string; friendsSearch?: string; v?: string }>;
}) {
  const [{ username }, viewer, query] = await Promise.all([params, getCurrentUser(), searchParams]);
  const commentsPage = parseCommentsPage(query.commentsPage);
  const friendsPage = parseFriendsPage(query.friendsPage);
  const result = await getPublicProfile(username, viewer?.id ?? null, commentsPage, friendsPage, query.friendsSearch ?? "");

  if (!result) notFound();
  if (query.v === "comments" && viewer && result.kind === "profile") {
    await clearProfileCommentNotifications(viewer.id, result.profile.username);
  }

  return (
    <main className="authenticated-shell">
      <header className="app-header">
        <Link className="brand" href="/">nexo<span>.</span></Link>
        <nav className="profile-navigation" aria-label="Navegación del perfil">
          {viewer ? <Link className="text-link" href="/home">Inicio</Link> : <Link className="text-link" href="/login">Iniciar sesión</Link>}
          {viewer && result.kind === "profile" && viewer.username.toLowerCase() === result.profile.username.toLowerCase() ? <Link className="text-link" href="/account/profile">Ajustes</Link> : null}
        </nav>
      </header>

      {result.kind === "private" ? (
        <section className="profile-panel profile-private" aria-labelledby="private-profile-title">
          <p className="eyebrow">Perfil restringido</p>
          <h1 id="private-profile-title">Este perfil no está disponible</h1>
          <p className="lead">La persona ha limitado quién puede consultar esta información.</p>
          {!viewer ? <Link className="button button-primary" href={`/login?returnUrl=/profile/${encodeURIComponent(username)}`}>Iniciar sesión</Link> : null}
        </section>
      ) : result.kind === "blocked" ? (
        <section className="profile-panel profile-private" aria-labelledby="blocked-profile-title">
          <p className="eyebrow">Bloqueo activo</p>
          <h1 id="blocked-profile-title">Has bloqueado este perfil</h1>
          <p className="lead">El contenido y las conexiones permanecen ocultos mientras el bloqueo esté activo.</p>
          {viewer ? <ProfileBlockActions blockedByViewer username={result.username} /> : null}
        </section>
      ) : (
        <section className="profile-panel" aria-labelledby="profile-title">
          <div className="profile-identity">
            <div className="profile-avatar" aria-hidden="true">{result.profile.displayName.slice(0, 1).toUpperCase()}</div>
            <div>
              <p className="eyebrow">Perfil público</p>
              <h1 id="profile-title">{result.profile.displayName}</h1>
              <p className="profile-username">@{result.profile.username}</p>
              <p className={`presence-status presence-${result.profile.presence.status}`}><span aria-hidden="true" />{result.profile.presence.status === "online" ? "En línea" : "Desconectado"}</p>
            </div>
          </div>
          {result.profile.status ? <p className="profile-status">{result.profile.status}</p> : null}
          <dl className="profile-facts">
            <div><dt>Miembro desde</dt><dd>{formatMemberSince(result.profile.memberSince)}</dd></div>
            <div><dt>Visibilidad</dt><dd>{result.profile.visibility === "public" ? "Público" : "Restringido"}</dd></div>
            <div><dt>Visitas</dt><dd>{result.profile.profileViews}</dd></div>
            <div><dt>Cuenta</dt><dd>{result.profile.verified ? "Email verificado" : "Pendiente de verificación"}</dd></div>
          </dl>
          {viewer ? <FriendRelationshipActions relationship={result.profile.relationship} username={result.profile.username} /> : null}
          {viewer && result.profile.relationship !== "self" ? <ProfileBlockActions blockedByViewer={false} username={result.profile.username} /> : null}
          {result.profile.fields.length > 0 ? (
            <section className="profile-field-display" aria-labelledby="profile-information-title">
              <h2 id="profile-information-title">Información</h2>
              <dl>
                {result.profile.fields.map((field) => (
                  <div key={`${field.categoryTitle}-${field.label}`}><dt>{field.label}</dt><dd>{Array.isArray(field.value) ? field.value.join(", ") : field.value}</dd></div>
                ))}
              </dl>
            </section>
          ) : null}
          <ProfileFriends
            friends={result.profile.friends}
            pagination={result.profile.friendsPagination}
            ownerUsername={result.profile.username}
            isOwner={result.profile.relationship === "self"}
          />
          <ProfileComments
            canComment={result.profile.canComment}
            comments={result.profile.comments}
            commentsPagination={result.profile.commentsPagination}
            ownerUsername={result.profile.username}
            viewer={viewer !== null}
          />
          <p className="profile-scope-note">Las fotos, las notificaciones y otras interacciones se incorporarán en los siguientes incrementos de esta vertical.</p>
        </section>
      )}
    </main>
  );
}

function parseCommentsPage(value: string | undefined): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function parseFriendsPage(value: string | undefined): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function formatMemberSince(date: Date): string {
  return new Intl.DateTimeFormat("es", { month: "long", year: "numeric" }).format(date);
}
