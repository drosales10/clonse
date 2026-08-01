import Link from "next/link";

import type { FriendRequestNotificationList } from "@domain/notifications";

export function FriendRequestNotifications({ notifications }: { notifications: FriendRequestNotificationList }) {
  return (
    <section className="notifications-panel" aria-labelledby="friend-request-notifications-title">
      <div className="activity-heading">
        <div>
          <p className="eyebrow">Avisos</p>
          <h2 id="friend-request-notifications-title">Solicitudes de conexión</h2>
        </div>
        {notifications.unreadCount > 0 ? <strong className="profile-view-total">{notifications.unreadCount}</strong> : null}
      </div>
      {notifications.items.length > 0 ? (
        <ul className="notification-list">
          {notifications.items.map((notification) => (
            <li className="notification-item" key={notification.id}>
              <span className="friend-avatar" aria-hidden="true">{notification.actor.displayName.slice(0, 1).toUpperCase()}</span>
              <div>
                <p><Link className="activity-actor" href={`/profile/${encodeURIComponent(notification.actor.username)}`}>{notification.actor.displayName}</Link> te ha enviado una solicitud de conexión.</p>
                <Link className="text-link" href="/account/friends">Gestionar solicitudes</Link>
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="empty-state">No tienes solicitudes de conexión recientes.</p>}
    </section>
  );
}
