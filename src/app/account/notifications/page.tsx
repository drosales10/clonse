import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { NotificationReadForm } from "@/app/components/notification-read-form";
import { getCurrentUser } from "@/server/auth/session";
import { getNotificationCenter } from "@/server/notifications/service";
import { ClientShell } from "@/components/client/ClientShell";

export const metadata: Metadata = {
  title: "Avisos | Red Social",
  description: "Consulta tus avisos recientes.",
};

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ read?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnUrl=/account/notifications");

  const [notifications, params] = await Promise.all([getNotificationCenter(user.id), searchParams]);

  return (
    <ClientShell current="notifications">
      <section className="profile-panel notifications-panel" aria-labelledby="notifications-title">
        <div className="activity-heading">
          <div>
            <p className="eyebrow">Cuenta · Avisos</p>
            <h1 id="notifications-title">Tus avisos</h1>
          </div>
          {notifications.unreadCount > 0 ? <strong className="profile-view-total">{notifications.unreadCount}</strong> : null}
        </div>
        {params.read === "1" ? <p className="success-message" role="status">Avisos marcados como leídos.</p> : null}
        {notifications.unreadCount > 0 ? <NotificationReadForm /> : null}
        {notifications.items.length > 0 ? (
          <ul className="notification-list">
            {notifications.items.map((notification) => {
              const href = notification.type === "profile_comment"
                ? `/profile/${encodeURIComponent(notification.profileOwnerUsername)}?v=comments`
                : `/profile/${encodeURIComponent(notification.actor.username)}`;
              const text = notification.type === "profile_comment" ? "ha comentado en tu perfil." : "te ha enviado una solicitud de amistad.";
              return (
                <li className={`notification-item${notification.readAt ? "" : " notification-unread"}`} key={notification.id}>
                  <span className="friend-avatar" aria-hidden="true">{notification.actor.displayName.slice(0, 1).toUpperCase()}</span>
                  <div>
                    <p><Link className="activity-actor" href={`/profile/${encodeURIComponent(notification.actor.username)}`}>{notification.actor.displayName}</Link> {text}</p>
                    <Link className="text-link" href={href}>Ver detalle</Link>
                    <time dateTime={notification.createdAt.toISOString()}>{formatDate(notification.createdAt)}</time>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : <p className="empty-state">No tienes avisos recientes.</p>}
      </section>
    </ClientShell>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
