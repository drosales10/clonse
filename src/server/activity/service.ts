import { Prisma } from "@prisma/client";

import {
  ACTIVITY_COALESCE_WINDOW_MS,
  ACTIVITY_FEED_LIMIT,
  ACTIVITY_TYPE_STATUS,
  type ActivityFeedItem,
} from "@domain/activity";
import { canViewProfile, type ProfileSettingsInput } from "@domain/profile";
import { db } from "@/server/db/client";

export async function updateStatusAndPrivacy(
  userId: string,
  input: ProfileSettingsInput,
): Promise<{ ok: true } | { ok: false; reason: "not_found" }> {
  const now = new Date();
  const coalesceSince = new Date(now.getTime() - ACTIVITY_COALESCE_WINDOW_MS);

  try {
    const updated = await db.$transaction(async (transaction) => {
      const actor = await transaction.user.findUnique({
        where: { id: userId },
        select: { id: true, enabled: true, verifiedAt: true },
      });
      if (!actor?.enabled || !actor.verifiedAt) return false;

      await transaction.user.update({
        where: { id: actor.id },
        data: {
          profilePrivacy: input.profilePrivacy,
          commentsPrivacy: input.commentsPrivacy,
          saveProfileViews: input.saveProfileViews,
          status: input.status,
          statusUpdatedAt: now,
        },
      });

      if (input.status) {
        const previous = await transaction.activity.findFirst({
          where: {
            actorId: actor.id,
            type: ACTIVITY_TYPE_STATUS,
            createdAt: { gt: coalesceSince },
          },
          orderBy: { createdAt: "desc" },
          select: { id: true },
        });

        if (previous) {
          await transaction.activity.update({
            where: { id: previous.id },
            data: { text: input.status, objectPrivacy: input.profilePrivacy, createdAt: now },
          });
        } else {
          await transaction.activity.create({
            data: {
              actorId: actor.id,
              type: ACTIVITY_TYPE_STATUS,
              text: input.status,
              objectPrivacy: input.profilePrivacy,
              createdAt: now,
            },
          });
        }
      }

      return true;
    });

    return updated ? { ok: true } : { ok: false, reason: "not_found" };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { ok: false, reason: "not_found" };
    }
    throw error;
  }
}

export async function getActivityFeed(viewerId: string): Promise<ActivityFeedItem[]> {
  const [viewer, connections] = await Promise.all([
    db.user.findUnique({ where: { id: viewerId }, select: { id: true, enabled: true, verifiedAt: true } }),
    db.friendConnection.findMany({
      where: {
        status: "accepted",
        OR: [{ requesterId: viewerId }, { addresseeId: viewerId }],
        requester: { enabled: true },
        addressee: { enabled: true },
      },
      select: { requesterId: true, addresseeId: true },
    }),
  ]);
  if (!viewer?.enabled || !viewer.verifiedAt) return [];

  const friendIds = new Set(
    connections.map((connection) => connection.requesterId === viewerId ? connection.addresseeId : connection.requesterId),
  );
  const candidateIds = [viewerId, ...friendIds];
  const blocks = await db.profileBlock.findMany({
    where: {
      OR: candidateIds.flatMap((candidateId) => [
        { blockerId: viewerId, blockedId: candidateId },
        { blockerId: candidateId, blockedId: viewerId },
      ]),
    },
    select: { blockerId: true, blockedId: true },
  });
  const blockedIds = new Set<string>();
  for (const block of blocks) {
    blockedIds.add(block.blockerId);
    blockedIds.add(block.blockedId);
  }

  const activities = await db.activity.findMany({
    where: {
      actorId: { in: candidateIds },
      type: ACTIVITY_TYPE_STATUS,
      actor: { enabled: true },
    },
    orderBy: { createdAt: "desc" },
    take: ACTIVITY_FEED_LIMIT * 3,
    select: {
      id: true,
      type: true,
      text: true,
      objectPrivacy: true,
      createdAt: true,
      actor: { select: { id: true, username: true, displayName: true } },
    },
  });

  return activities
    .filter((activity) => {
      if (blockedIds.has(activity.actor.id)) return false;
      if (activity.actor.id === viewerId) return true;
      return friendIds.has(activity.actor.id) && canViewProfile(activity.actor.id, activity.objectPrivacy, viewerId, true);
    })
    .slice(0, ACTIVITY_FEED_LIMIT)
    .map((activity) => ({
      id: activity.id,
      type: ACTIVITY_TYPE_STATUS,
      text: activity.text,
      createdAt: activity.createdAt,
      actor: { username: activity.actor.username, displayName: activity.actor.displayName },
    }));
}
