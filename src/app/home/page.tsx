import Link from "next/link";
import { redirect } from "next/navigation";

import { ActivityPagination } from "@/app/components/activity-pagination";
import { ProfileViewsResetForm } from "@/app/components/profile-views-reset-form";
import { ProfileCommentNotifications } from "@/app/components/profile-comment-notifications";
import { FriendRequestNotifications } from "@/app/components/friend-request-notifications";
import { StatusComposer } from "@/app/components/status-composer";
import { ClientShell } from "@/components/client/ClientShell";
import { getActivityFeed } from "@/server/activity/service";
import { getFriendRequestNotifications, getProfileCommentNotifications } from "@/server/notifications/service";
import { getCurrentUser } from "@/server/auth/session";
import { getOwnProfileViews } from "@/server/profile-views/service";
import { getOwnProfileSettings } from "@/server/profile/service";

const exploreLinks = [
  { href: "/people", label: "Descubrir personas" },
  { href: "/groups", label: "Grupos" },
  { href: "/events", label: "Eventos" },
  { href: "/albums", label: "Álbumes" },
  { href: "/polls", label: "Encuestas" },
  { href: "/forum", label: "Foros" },
  { href: "/blogs", label: "Blogs" },
  { href: "/articles", label: "Artículos" },
  { href: "/businesses", label: "Negocios" },
  { href: "/classifieds", label: "Clasificados" },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; viewsReset?: string; activityPage?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnUrl=/home");

  const params = await searchParams;
  const activityPage = parseActivityPage(params.activityPage);
  const [activityFeed, profileViews, notifications, friendRequestNotifications, profileSettings] =
    await Promise.all([
      getActivityFeed(user.id, activityPage),
      getOwnProfileViews(user.id),
      getProfileCommentNotifications(user.id),
      getFriendRequestNotifications(user.id),
      getOwnProfileSettings(user.id),
    ]);

  return (
    <ClientShell current="home">
      <div className="client-home-layout">
        <div className="client-feed">
          <section className="home-hero-block" aria-labelledby="welcome-title">
            <p className="eyebrow">Inicio</p>
            <h1 id="welcome-title">Hola, {user.displayName}</h1>
            <p className="lead">
              Tu red está activa. Revisa la actividad, avisos y encuentra nuevas conexiones.
            </p>
            {params.welcome === "1" ? (
              <p className="success-message" role="status">
                Cuenta creada. El siguiente incremento añadirá verificación por email.
              </p>
            ) : null}
            {params.viewsReset === "1" ? (
              <p className="success-message" role="status">
                Tus estadísticas de visitas se han reiniciado.
              </p>
            ) : null}
          </section>

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
                      <Link
                        className="public-friend"
                        href={`/profile/${encodeURIComponent(viewer.username)}`}
                        key={viewer.username}
                      >
                        <span className="friend-avatar" aria-hidden="true">
                          {viewer.displayName.slice(0, 1).toUpperCase()}
                        </span>
                        <span>
                          <strong>{viewer.displayName}</strong>
                          <small>@{viewer.username}</small>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="empty-state">Todavía no hay visitantes registrados que mostrar.</p>
              )}
              {profileViews.totalViews > 0 ? <ProfileViewsResetForm /> : null}
            </section>
          ) : null}

          <FriendRequestNotifications notifications={friendRequestNotifications} />
          <ProfileCommentNotifications notifications={notifications} />

          <StatusComposer currentStatus={profileSettings?.status ?? null} />

          <section className="activity-panel" aria-labelledby="activity-title">
            <div className="activity-heading">
              <div>
                <p className="eyebrow">Red · Actividad</p>
                <h2 id="activity-title">Qué está pasando</h2>
              </div>
            </div>
            {activityFeed.items.length > 0 ? (
              <ol className="activity-list">
                {activityFeed.items.map((activity) => (
                  <li className="activity-item" key={activity.id}>
                    <span className="friend-avatar" aria-hidden="true">
                      {activity.actor.displayName.slice(0, 1).toUpperCase()}
                    </span>
                    <div>
                      <p>
                        <Link
                          className="activity-actor"
                          href={`/profile/${encodeURIComponent(activity.actor.username)}`}
                        >
                          {activity.actor.displayName}
                        </Link>
                        {activity.type === "addfriend"
                          ? " ha creado una conexión"
                          : " ha actualizado su estado"}
                      </p>
                      {activity.type === "editstatus" ? <blockquote>{activity.text}</blockquote> : null}
                      <time>{formatActivityAge(activity.createdAt)}</time>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="empty-state">
                Todavía no hay actividad visible. Publica un estado o conecta con otras personas.
              </p>
            )}
            <ActivityPagination pagination={activityFeed.pagination} />
          </section>
        </div>

        <aside className="client-aside" aria-label="Explorar">
          <div className="explore-rail">
            <h2>Explorar</h2>
            {exploreLinks.map((item) => (
              <Link href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
          <div className="explore-rail">
            <h2>Tu cuenta</h2>
            <Link href={`/profile/${encodeURIComponent(user.username)}`}>Mi perfil</Link>
            <Link href="/account/friends">Conexiones</Link>
            <Link href="/account/blocks">Bloqueos</Link>
            <Link href="/account/notifications">Centro de avisos</Link>
            <Link href="/account/profile">Ajustes</Link>
          </div>
        </aside>
      </div>
    </ClientShell>
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
  const hours = Math.floor(elapsedMinutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} d`;
}
