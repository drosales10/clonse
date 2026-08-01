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

export async function clearProfileCommentNotifications(userId: string, ownerUsername: string): Promise<number> {
  const owner = await db.user.findFirst({
    where: { username: { equals: ownerUsername, mode: "insensitive" }, enabled: true },
    select: { id: true },
  });
  if (!owner || owner.id !== userId) return 0;

  const result = await db.notification.deleteMany({
    where: {
      recipientId: userId,
      profileOwnerId: owner.id,
      objectId: owner.id,
      type: NOTIFICATION_TYPE_PROFILE_COMMENT,
    },
  });
  return result.count;
}
