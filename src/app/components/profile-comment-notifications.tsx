import Link from "next/link";

import type { NotificationList } from "@domain/notifications";

export function ProfileCommentNotifications({ notifications }: { notifications: NotificationList }) {
  return (
    <section className="notifications-panel" aria-labelledby="notifications-title">
      <div className="activity-heading">
        <div>
          <p className="eyebrow">Avisos</p>
          <h2 id="notifications-title">Comentarios en tu perfil</h2>
        </div>
        {notifications.unreadCount > 0 ? <strong className="profile-view-total">{notifications.unreadCount}</strong> : null}
      </div>
      {notifications.items.length > 0 ? (
        <ul className="notification-list">
          {notifications.items.map((notification) => (
            <li className="notification-item" key={notification.id}>
              <span className="friend-avatar" aria-hidden="true">{notification.actor.displayName.slice(0, 1).toUpperCase()}</span>
              <div>
                <p><Link className="activity-actor" href={`/profile/${encodeURIComponent(notification.actor.username)}`}>{notification.actor.displayName}</Link> ha comentado en tu perfil.</p>
                <Link className="text-link" href={`/profile/${encodeURIComponent(notification.profileOwnerUsername)}`}>Ver perfil</Link>
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="empty-state">No tienes avisos de comentarios recientes.</p>}
    </section>
  );
}
