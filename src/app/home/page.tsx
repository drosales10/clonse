import Link from "next/link";
import { redirect } from "next/navigation";

import { logoutAction } from "@/app/actions/auth";
import { ActivityPagination } from "@/app/components/activity-pagination";
import { ProfileViewsResetForm } from "@/app/components/profile-views-reset-form";
import { ProfileCommentNotifications } from "@/app/components/profile-comment-notifications";
import { FriendRequestNotifications } from "@/app/components/friend-request-notifications";
import { getActivityFeed } from "@/server/activity/service";
import { getFriendRequestNotifications, getProfileCommentNotifications } from "@/server/notifications/service";
import { getCurrentUser } from "@/server/auth/session";
import { getOwnProfileViews } from "@/server/profile-views/service";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; viewsReset?: string; activityPage?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnUrl=/home");

  const params = await searchParams;
  const activityPage = parseActivityPage(params.activityPage);
  const [activityFeed, profileViews, notifications, friendRequestNotifications] = await Promise.all([
    getActivityFeed(user.id, activityPage),
    getOwnProfileViews(user.id),
    getProfileCommentNotifications(user.id),
    getFriendRequestNotifications(user.id),
  ]);
  return (
    <main className="authenticated-shell">
      <header className="app-header">
        <Link className="brand" href="/">nexo<span>.</span></Link>
        <nav className="profile-navigation" aria-label="Navegación de cuenta">
          <Link className="text-link" href={`/profile/${encodeURIComponent(user.username)}`}>Mi perfil</Link>
          <Link className="text-link" href="/account/friends">Conexiones</Link>
          <Link className="text-link" href="/account/blocks">Bloqueos</Link>
          <Link className="text-link" href="/account/profile">Ajustes</Link>
          <form action={logoutAction}>
            <button className="button button-quiet" type="submit">Cerrar sesión</button>
          </form>
        </nav>
      </header>
      <section className="welcome-panel" aria-labelledby="welcome-title">
        <p className="eyebrow">Inicio autenticado</p>
        <h1 id="welcome-title">Hola, {user.displayName}</h1>
        <p className="lead">Tu sesión está activa como <strong>{user.email}</strong>.</p>
        {params.welcome === "1" ? <p className="success-message" role="status">Cuenta creada. El siguiente incremento añadirá verificación por email.</p> : null}
        {params.viewsReset === "1" ? <p className="success-message" role="status">Tus estadísticas de visitas se han reiniciado.</p> : null}
        {profileViews ? (
          <section className="profile-views-panel" aria-labelledby="profile-views-title">
            <div className="activity-heading">
              <div>
                <p className="eyebrow">Perfil · Estadísticas</p>
                <h2 id="profile-views-title">Visitas a tu perfil</h2>
              </div>
              <strong className="profile-view-total">{profileViews.totalViews}</strong>
            </div>
            {profileViews.viewers.length > 0 ? (
              <div className="profile-viewers-list">
                <p className="field-help">Visitantes registrados recientes</p>
                <div className="public-friends-list">
                  {profileViews.viewers.map((viewer) => (
                    <Link className="public-friend" href={`/profile/${encodeURIComponent(viewer.username)}`} key={viewer.username}>
                      <span className="friend-avatar" aria-hidden="true">{viewer.displayName.slice(0, 1).toUpperCase()}</span>
                      <span><strong>{viewer.displayName}</strong><small>@{viewer.username}</small></span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : <p className="empty-state">Todavía no hay visitantes registrados que mostrar.</p>}
            {profileViews.totalViews > 0 ? <ProfileViewsResetForm /> : null}
          </section>
        ) : null}
        <FriendRequestNotifications notifications={friendRequestNotifications} />
        <ProfileCommentNotifications notifications={notifications} />
        <section className="activity-panel" aria-labelledby="activity-title">
          <div className="activity-heading">
            <div>
              <p className="eyebrow">Red · Actividad</p>
              <h2 id="activity-title">Qué está pasando</h2>
            </div>
            <Link className="text-link" href="/account/profile">Publicar estado</Link>
          </div>
          {activityFeed.items.length > 0 ? (
            <ol className="activity-list">
              {activityFeed.items.map((activity) => (
                <li className="activity-item" key={activity.id}>
                  <span className="friend-avatar" aria-hidden="true">{activity.actor.displayName.slice(0, 1).toUpperCase()}</span>
                  <div>
                    <p><Link className="activity-actor" href={`/profile/${encodeURIComponent(activity.actor.username)}`}>{activity.actor.displayName}</Link>{activity.type === "addfriend" ? " ha creado una conexión" : " ha actualizado su estado"}</p>
                    {activity.type === "editstatus" ? <blockquote>{activity.text}</blockquote> : null}
                    <time>{formatActivityAge(activity.createdAt)}</time>
                  </div>
                </li>
              ))}
            </ol>
          ) : <p className="empty-state">Todavía no hay actividad visible. Publica un estado o conecta con otras personas.</p>}
          <ActivityPagination pagination={activityFeed.pagination} />
        </section>
        <div className="scope-grid">
          <article><span>01</span><h2>Actividad</h2><p>Estados y actividad de tus conexiones, protegidos por privacidad y bloqueos.</p><Link className="text-link" href="/account/profile">Compartir un estado →</Link></article>
          <article><span>02</span><h2>Perfil</h2><p>Privacidad y estado ya se pueden gestionar; campos dinámicos y foto requieren el inventario de settings y niveles.</p><Link className="text-link" href="/account/profile">Configurar mi perfil →</Link></article>
          <article><span>03</span><h2>Mensajes</h2><p>La comunicación usará la sesión server-side sin exponer datos privados al cliente.</p></article>
        </div>
      </section>
    </main>
  );
}

function parseActivityPage(value: string | undefined): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function formatActivityAge(date: Date): string {
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (elapsedMinutes < 1) return "Ahora";
  if (elapsedMinutes < 60) return `Hace ${elapsedMinutes} min`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `Hace ${elapsedHours} h`;
  const elapsedDays = Math.floor(elapsedHours / 24);
  return `Hace ${elapsedDays} d`;
}
