import {
  NOTIFICATION_LEGACY_FRIEND_REQUEST_TYPE,
  NOTIFICATION_LIST_LIMIT,
  NOTIFICATION_TYPE_FRIEND_REQUEST,
  NOTIFICATION_TYPE_PROFILE_COMMENT,
  type FriendRequestNotificationList,
  type NotificationList,
} from "@domain/notifications";
import { Prisma } from "@prisma/client";
import { db } from "@/server/db/client";

export type NotificationTransaction = Prisma.TransactionClient;

export async function createFriendRequestNotification(
  transaction: NotificationTransaction,
  requesterId: string,
  addresseeId: string,
): Promise<void> {
  await transaction.notification.create({
    data: {
      recipientId: addresseeId,
      actorId: requesterId,
      profileOwnerId: addresseeId,
      type: NOTIFICATION_TYPE_FRIEND_REQUEST,
      legacyTypeId: NOTIFICATION_LEGACY_FRIEND_REQUEST_TYPE,
      objectId: requesterId,
    },
  });
}

export async function deleteFriendRequestNotification(
  transaction: NotificationTransaction,
  requesterId: string,
  addresseeId: string,
): Promise<void> {
  await transaction.notification.deleteMany({
    where: {
      recipientId: addresseeId,
      actorId: requesterId,
      objectId: requesterId,
      type: NOTIFICATION_TYPE_FRIEND_REQUEST,
    },
  });
}


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

export async function getFriendRequestNotifications(userId: string): Promise<FriendRequestNotificationList> {
  const where = {
    recipientId: userId,
    type: NOTIFICATION_TYPE_FRIEND_REQUEST,
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
      },
    }),
  ]);

  return {
    unreadCount,
    items: notifications.map((notification) => ({
      id: notification.id,
      type: NOTIFICATION_TYPE_FRIEND_REQUEST,
      actor: notification.actor,
      createdAt: notification.createdAt,
    })),
  };
}


export async function getNotificationCenter(userId: string): Promise<import("@domain/notifications").NotificationCenterList> {
  const notificationTypes: string[] = [NOTIFICATION_TYPE_PROFILE_COMMENT, NOTIFICATION_TYPE_FRIEND_REQUEST];
  const where = {
    recipientId: userId,
    type: { in: notificationTypes },
    actor: { enabled: true },
  };
  const [unreadCount, notifications] = await Promise.all([
    db.notification.count({ where: { ...where, readAt: null } }),
    db.notification.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: NOTIFICATION_LIST_LIMIT,
      select: {
        id: true,
        type: true,
        readAt: true,
        createdAt: true,
        actor: { select: { username: true, displayName: true } },
        profileOwner: { select: { username: true } },
      },
    }),
  ]);

  return {
    unreadCount,
    items: notifications.flatMap((notification) =>
      notification.type === NOTIFICATION_TYPE_PROFILE_COMMENT || notification.type === NOTIFICATION_TYPE_FRIEND_REQUEST
        ? [{
            id: notification.id,
            type: notification.type,
            actor: notification.actor,
            profileOwnerUsername: notification.profileOwner.username,
            createdAt: notification.createdAt,
            readAt: notification.readAt,
          }]
        : [],
    ),
  };
}

export async function markAllNotificationsRead(userId: string): Promise<number> {
  const result = await db.notification.updateMany({
    where: {
      recipientId: userId,
      type: { in: [NOTIFICATION_TYPE_PROFILE_COMMENT, NOTIFICATION_TYPE_FRIEND_REQUEST] },
      readAt: null,
    },
    data: { readAt: new Date() },
  });
  return result.count;
}
