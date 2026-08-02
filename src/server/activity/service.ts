import { Prisma } from "@prisma/client";

import {
  ACTIVITY_COALESCE_WINDOW_MS,
  ACTIVITY_FEED_PAGE_SIZE,
  ACTIVITY_TYPE_FRIEND,
  ACTIVITY_TYPE_STATUS,
  type ActivityFeedResult,
} from "@domain/activity";
import { canViewProfile, isProfilePrivacy, type ProfileSettingsInput } from "@domain/profile";
import { db } from "@/server/db/client";

export type ActivityTransaction = Prisma.TransactionClient;

export async function recordFriendActivity(
  transaction: ActivityTransaction,
  actorId: string,
  friendId: string,
): Promise<void> {
  const [actor, friend] = await Promise.all([
    transaction.user.findUnique({ where: { id: actorId }, select: { displayName: true, profilePrivacy: true } }),
    transaction.user.findUnique({ where: { id: friendId }, select: { displayName: true } }),
  ]);
  if (!actor || !friend) return;

  await transaction.activity.create({
    data: {
      actorId,
      type: ACTIVITY_TYPE_FRIEND,
      text: `Se ha conectado con ${friend.displayName}`,
      objectPrivacy: actor.profilePrivacy,
    },
  });
}

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

export async function updateOwnStatus(
  userId: string,
  status: string | null,
): Promise<{ ok: true } | { ok: false; reason: "not_found" }> {
  const current = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      enabled: true,
      verifiedAt: true,
      profilePrivacy: true,
      commentsPrivacy: true,
      saveProfileViews: true,
    },
  });
  if (!current?.enabled || !current.verifiedAt) return { ok: false, reason: "not_found" };
  if (!isProfilePrivacy(current.profilePrivacy) || !isProfilePrivacy(current.commentsPrivacy)) {
    return { ok: false, reason: "not_found" };
  }

  return updateStatusAndPrivacy(userId, {
    profilePrivacy: current.profilePrivacy,
    commentsPrivacy: current.commentsPrivacy,
    saveProfileViews: current.saveProfileViews,
    status,
  });
}

export async function getActivityFeed(viewerId: string, requestedPage = 1): Promise<ActivityFeedResult> {
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
  if (!viewer?.enabled || !viewer.verifiedAt) return emptyActivityFeed();

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
      type: { in: [ACTIVITY_TYPE_STATUS, ACTIVITY_TYPE_FRIEND] },
      actor: { enabled: true },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      type: true,
      text: true,
      objectPrivacy: true,
      createdAt: true,
      actor: { select: { id: true, username: true, displayName: true } },
    },
  });

  const visibleActivities = activities
    .filter((activity) => {
      if (blockedIds.has(activity.actor.id)) return false;
      if (activity.actor.id === viewerId) return true;
      return friendIds.has(activity.actor.id) && canViewProfile(activity.actor.id, activity.objectPrivacy, viewerId, true);
    })
    .map((activity) => ({
      id: activity.id,
      type: activity.type === ACTIVITY_TYPE_FRIEND ? ACTIVITY_TYPE_FRIEND : ACTIVITY_TYPE_STATUS,
      text: activity.text,
      createdAt: activity.createdAt,
      actor: { username: activity.actor.username, displayName: activity.actor.displayName },
    }));
  const total = visibleActivities.length;
  const pageCount = Math.max(1, Math.ceil(total / ACTIVITY_FEED_PAGE_SIZE));
  const page = normalizeActivityPage(requestedPage, pageCount);
  const startIndex = (page - 1) * ACTIVITY_FEED_PAGE_SIZE;
  const items = visibleActivities.slice(startIndex, startIndex + ACTIVITY_FEED_PAGE_SIZE);

  return {
    items,
    pagination: {
      page,
      pageSize: ACTIVITY_FEED_PAGE_SIZE,
      total,
      pageCount,
      start: total === 0 ? 0 : startIndex + 1,
      end: startIndex + items.length,
    },
  };
}

function normalizeActivityPage(value: number, pageCount: number): number {
  if (!Number.isInteger(value) || value < 1) return 1;
  return Math.min(value, pageCount);
}

function emptyActivityFeed(): ActivityFeedResult {
  return {
    items: [],
    pagination: { page: 1, pageSize: ACTIVITY_FEED_PAGE_SIZE, total: 0, pageCount: 1, start: 0, end: 0 },
  };
}
