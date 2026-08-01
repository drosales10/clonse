import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FriendRelationshipActions } from "@/app/components/friend-relationship-actions";
import { ProfileBlockActions } from "@/app/components/profile-block-actions";
import { getCurrentUser } from "@/server/auth/session";
import { getPublicProfile } from "@/server/profile/service";

export const metadata: Metadata = {
  title: "Perfil | Red Social",
  description: "Consulta un perfil de la red social.",
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const [{ username }, viewer] = await Promise.all([params, getCurrentUser()]);
  const result = await getPublicProfile(username, viewer?.id ?? null);

  if (!result) notFound();

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
            </div>
          </div>
          {result.profile.status ? <p className="profile-status">{result.profile.status}</p> : null}
          <dl className="profile-facts">
            <div><dt>Miembro desde</dt><dd>{formatMemberSince(result.profile.memberSince)}</dd></div>
            <div><dt>Visibilidad</dt><dd>{result.profile.visibility === "public" ? "Público" : "Restringido"}</dd></div>
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
          <section className="profile-friends-display" aria-labelledby="profile-friends-title">
            <div className="profile-friends-heading">
              <h2 id="profile-friends-title">Conexiones</h2>
              {result.profile.relationship === "self" ? <Link className="text-link" href="/account/friends">Gestionar</Link> : null}
            </div>
            {result.profile.friends.length > 0 ? (
              <div className="public-friends-list">
                {result.profile.friends.map((friend) => (
                  <Link className="public-friend" href={`/profile/${encodeURIComponent(friend.username)}`} key={friend.username}>
                    <span className="friend-avatar" aria-hidden="true">{friend.displayName.slice(0, 1).toUpperCase()}</span>
                    <span><strong>{friend.displayName}</strong><small>@{friend.username}</small></span>
                  </Link>
                ))}
              </div>
            ) : <p className="empty-state">Todavía no hay conexiones confirmadas visibles.</p>}
          </section>
          <p className="profile-scope-note">Las fotos y la actividad se incorporarán en los siguientes incrementos de esta vertical.</p>
        </section>
      )}
    </main>
  );
}

function formatMemberSince(date: Date): string {
  return new Intl.DateTimeFormat("es", { month: "long", year: "numeric" }).format(date);
}
