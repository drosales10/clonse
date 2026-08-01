import {
  NOTIFICATION_LIST_LIMIT,
  NOTIFICATION_TYPE_PROFILE_COMMENT,
  type NotificationList,
} from "@domain/notifications";
import { db } from "@/server/db/client";

export async function getProfileCommentNotifications(userId: string): Promise<NotificationList> {
  const where = {
    recipientId: userId,
    type: NOTIFICATION_TYPE_PROFILE_COMMENT,
    actor: { enabled: true },
  } as const;
  const [unreadCount, notifications] = await Promise.all([
    db.notification.count({ where: { ...where, readAt: null } }),
    db.notification.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: NOTIFICATION_LIST_LIMIT,
      select: {
        id: true,
        createdAt: true,
        actor: { select: { username: true, displayName: true } },
        profileOwner: { select: { username: true } },
      },
    }),
  ]);

  return {
    unreadCount,
    items: notifications.map((notification) => ({
      id: notification.id,
      type: NOTIFICATION_TYPE_PROFILE_COMMENT,
      actor: notification.actor,
      profileOwnerUsername: notification.profileOwner.username,
      createdAt: notification.createdAt,
    })),
  };
}
