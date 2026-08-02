import type { AdminModuleKind } from "@domain/admin-flags";
import { isProfilePrivacy } from "@domain/profile";

import { db } from "@/server/db/client";

export type AdminModuleFlagsSnapshot = {
  kind: AdminModuleKind;
  resourceId: string;
  resourceLabel: string;
  values: Record<string, boolean | number | string | null>;
};

export type AdminModuleFlagsMutationResult =
  | { ok: true; changes: Record<string, { from: unknown; to: unknown }> }
  | { ok: false; reason: "not_found" | "invalid_privacy" };

function parsePrivacy(value: unknown): number | null | "invalid" {
  if (value === null || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(num) || !isProfilePrivacy(num)) return "invalid";
  return num;
}

function parseDatetime(value: unknown): Date | null | "invalid" {
  if (value === null || value === "") return null;
  if (typeof value !== "string") return "invalid";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "invalid";
  return date;
}

function diffChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Record<string, { from: unknown; to: unknown }> {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (before[key] !== after[key]) {
      changes[key] = { from: before[key], to: after[key] };
    }
  }
  return changes;
}

function serializeValue(value: unknown): boolean | number | string | null {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return null;
  return String(value);
}

export async function getAdminModuleFlags(
  kind: AdminModuleKind,
  resourceId: string,
): Promise<AdminModuleFlagsSnapshot | null> {
  switch (kind) {
    case "group": {
      const row = await db.group.findUnique({
        where: { id: resourceId },
        select: {
          id: true,
          title: true,
          catalogVisible: true,
          searchable: true,
          inviteEnabled: true,
          uploadEnabled: true,
          membershipApprovalRequired: true,
          privacy: true,
          commentsPrivacy: true,
          discussionPrivacy: true,
        },
      });
      if (!row) return null;
      return {
        kind,
        resourceId: row.id,
        resourceLabel: row.title,
        values: {
          catalogVisible: row.catalogVisible,
          searchable: row.searchable,
          inviteEnabled: row.inviteEnabled,
          uploadEnabled: row.uploadEnabled,
          membershipApprovalRequired: row.membershipApprovalRequired,
          privacy: row.privacy,
          commentsPrivacy: row.commentsPrivacy ?? row.privacy,
          discussionPrivacy: row.discussionPrivacy ?? row.privacy,
        },
      };
    }
    case "event": {
      const row = await db.event.findUnique({
        where: { id: resourceId },
        select: {
          id: true,
          title: true,
          catalogVisible: true,
          searchable: true,
          inviteOnly: true,
          privacy: true,
        },
      });
      if (!row) return null;
      return {
        kind,
        resourceId: row.id,
        resourceLabel: row.title,
        values: {
          catalogVisible: row.catalogVisible,
          searchable: row.searchable,
          inviteOnly: row.inviteOnly,
          privacy: row.privacy,
        },
      };
    }
    case "poll": {
      const row = await db.poll.findUnique({
        where: { id: resourceId },
        select: {
          id: true,
          title: true,
          catalogVisible: true,
          searchable: true,
          closed: true,
          privacy: true,
          commentsPrivacy: true,
        },
      });
      if (!row) return null;
      return {
        kind,
        resourceId: row.id,
        resourceLabel: row.title,
        values: {
          catalogVisible: row.catalogVisible,
          searchable: row.searchable,
          closed: row.closed,
          privacy: row.privacy,
          commentsPrivacy: row.commentsPrivacy ?? row.privacy,
        },
      };
    }
    case "album": {
      const row = await db.album.findUnique({
        where: { id: resourceId },
        select: {
          id: true,
          title: true,
          catalogVisible: true,
          searchable: true,
          privacy: true,
          commentsPrivacy: true,
        },
      });
      if (!row) return null;
      return {
        kind,
        resourceId: row.id,
        resourceLabel: row.title,
        values: {
          catalogVisible: row.catalogVisible,
          searchable: row.searchable,
          privacy: row.privacy,
          commentsPrivacy: row.commentsPrivacy ?? row.privacy,
        },
      };
    }
    case "classified": {
      const row = await db.classified.findUnique({
        where: { id: resourceId },
        select: {
          id: true,
          title: true,
          catalogVisible: true,
          searchable: true,
          privacy: true,
        },
      });
      if (!row) return null;
      return {
        kind,
        resourceId: row.id,
        resourceLabel: row.title,
        values: {
          catalogVisible: row.catalogVisible,
          searchable: row.searchable,
          privacy: row.privacy,
        },
      };
    }
    case "blog": {
      const row = await db.blogEntry.findUnique({
        where: { id: resourceId },
        select: {
          id: true,
          title: true,
          catalogVisible: true,
          searchable: true,
          privacy: true,
          commentsPrivacy: true,
        },
      });
      if (!row) return null;
      return {
        kind,
        resourceId: row.id,
        resourceLabel: row.title,
        values: {
          catalogVisible: row.catalogVisible,
          searchable: row.searchable,
          privacy: row.privacy,
          commentsPrivacy: row.commentsPrivacy ?? row.privacy,
        },
      };
    }
    case "business": {
      const row = await db.business.findUnique({
        where: { id: resourceId },
        select: {
          id: true,
          title: true,
          catalogVisible: true,
          searchable: true,
          featured: true,
          sponsored: true,
          approvedAt: true,
          expiresAt: true,
          privacy: true,
        },
      });
      if (!row) return null;
      return {
        kind,
        resourceId: row.id,
        resourceLabel: row.title,
        values: {
          catalogVisible: row.catalogVisible,
          searchable: row.searchable,
          featured: row.featured,
          sponsored: row.sponsored,
          approved: row.approvedAt !== null,
          expiresAt: row.expiresAt ? row.expiresAt.toISOString().slice(0, 16) : null,
          privacy: row.privacy,
        },
      };
    }
    case "article": {
      const row = await db.article.findUnique({
        where: { id: resourceId },
        select: {
          id: true,
          title: true,
          catalogVisible: true,
          searchable: true,
          draft: true,
          approved: true,
          featured: true,
          privacy: true,
          commentsPrivacy: true,
        },
      });
      if (!row) return null;
      return {
        kind,
        resourceId: row.id,
        resourceLabel: row.title,
        values: {
          catalogVisible: row.catalogVisible,
          searchable: row.searchable,
          draft: row.draft,
          approved: row.approved,
          featured: row.featured,
          privacy: row.privacy,
          commentsPrivacy: row.commentsPrivacy ?? row.privacy,
        },
      };
    }
    case "forum-topic": {
      const row = await db.forumPost.findFirst({
        where: { id: resourceId, parentId: null },
        select: {
          id: true,
          title: true,
          isLocked: true,
          isSticky: true,
          isAnnouncement: true,
        },
      });
      if (!row) return null;
      return {
        kind,
        resourceId: row.id,
        resourceLabel: row.title ?? "Sin título",
        values: {
          isLocked: row.isLocked,
          isSticky: row.isSticky,
          isAnnouncement: row.isAnnouncement,
        },
      };
    }
    case "forum-category": {
      const row = await db.forumCategory.findUnique({
        where: { id: resourceId },
        select: { id: true, title: true, isLocked: true, publicCanRead: true },
      });
      if (!row) return null;
      return {
        kind,
        resourceId: row.id,
        resourceLabel: row.title,
        values: {
          isLocked: row.isLocked,
          publicCanRead: row.publicCanRead,
        },
      };
    }
    case "user-profile": {
      const row = await db.user.findUnique({
        where: { id: resourceId },
        select: {
          id: true,
          username: true,
          enabled: true,
          verifiedAt: true,
          profilePrivacy: true,
          commentsPrivacy: true,
          saveProfileViews: true,
        },
      });
      if (!row) return null;
      return {
        kind,
        resourceId: row.id,
        resourceLabel: `@${row.username}`,
        values: {
          enabled: row.enabled,
          verified: row.verifiedAt !== null,
          profilePrivacy: row.profilePrivacy,
          commentsPrivacy: row.commentsPrivacy,
          saveProfileViews: row.saveProfileViews,
        },
      };
    }
    default:
      return null;
  }
}

export async function updateAdminModuleFlags(
  kind: AdminModuleKind,
  resourceId: string,
  input: Record<string, boolean | number | string | null>,
): Promise<AdminModuleFlagsMutationResult> {
  const current = await getAdminModuleFlags(kind, resourceId);
  if (!current) return { ok: false, reason: "not_found" };

  const before: Record<string, unknown> = { ...current.values };

  switch (kind) {
    case "group": {
      const privacy = parsePrivacy(input.privacy ?? current.values.privacy);
      const commentsPrivacy = parsePrivacy(input.commentsPrivacy ?? current.values.commentsPrivacy);
      const discussionPrivacy = parsePrivacy(input.discussionPrivacy ?? current.values.discussionPrivacy);
      if (privacy === "invalid" || commentsPrivacy === "invalid" || discussionPrivacy === "invalid") {
        return { ok: false, reason: "invalid_privacy" };
      }
      await db.group.update({
        where: { id: resourceId },
        data: {
          catalogVisible: Boolean(input.catalogVisible),
          searchable: Boolean(input.searchable),
          inviteEnabled: Boolean(input.inviteEnabled),
          uploadEnabled: Boolean(input.uploadEnabled),
          membershipApprovalRequired: Boolean(input.membershipApprovalRequired),
          privacy: privacy ?? 0,
          commentsPrivacy: commentsPrivacy,
          discussionPrivacy: discussionPrivacy,
          updatedAt: new Date(),
        },
      });
      break;
    }
    case "event": {
      const privacy = parsePrivacy(input.privacy ?? current.values.privacy);
      if (privacy === "invalid") return { ok: false, reason: "invalid_privacy" };
      await db.event.update({
        where: { id: resourceId },
        data: {
          catalogVisible: Boolean(input.catalogVisible),
          searchable: Boolean(input.searchable),
          inviteOnly: Boolean(input.inviteOnly),
          privacy: privacy ?? 64,
          updatedAt: new Date(),
        },
      });
      break;
    }
    case "poll": {
      const privacy = parsePrivacy(input.privacy ?? current.values.privacy);
      const commentsPrivacy = parsePrivacy(input.commentsPrivacy ?? current.values.commentsPrivacy);
      if (privacy === "invalid" || commentsPrivacy === "invalid") {
        return { ok: false, reason: "invalid_privacy" };
      }
      await db.poll.update({
        where: { id: resourceId },
        data: {
          catalogVisible: Boolean(input.catalogVisible),
          searchable: Boolean(input.searchable),
          closed: Boolean(input.closed),
          privacy: privacy ?? 0,
          commentsPrivacy: commentsPrivacy,
          updatedAt: new Date(),
        },
      });
      break;
    }
    case "album": {
      const privacy = parsePrivacy(input.privacy ?? current.values.privacy);
      const commentsPrivacy = parsePrivacy(input.commentsPrivacy ?? current.values.commentsPrivacy);
      if (privacy === "invalid" || commentsPrivacy === "invalid") {
        return { ok: false, reason: "invalid_privacy" };
      }
      await db.album.update({
        where: { id: resourceId },
        data: {
          catalogVisible: Boolean(input.catalogVisible),
          searchable: Boolean(input.searchable),
          privacy: privacy ?? 0,
          commentsPrivacy: commentsPrivacy,
          updatedAt: new Date(),
        },
      });
      break;
    }
    case "classified": {
      const privacy = parsePrivacy(input.privacy ?? current.values.privacy);
      if (privacy === "invalid") return { ok: false, reason: "invalid_privacy" };
      await db.classified.update({
        where: { id: resourceId },
        data: {
          catalogVisible: Boolean(input.catalogVisible),
          searchable: Boolean(input.searchable),
          privacy: privacy ?? 63,
          updatedAt: new Date(),
        },
      });
      break;
    }
    case "blog": {
      const privacy = parsePrivacy(input.privacy ?? current.values.privacy);
      const commentsPrivacy = parsePrivacy(input.commentsPrivacy ?? current.values.commentsPrivacy);
      if (privacy === "invalid" || commentsPrivacy === "invalid") {
        return { ok: false, reason: "invalid_privacy" };
      }
      await db.blogEntry.update({
        where: { id: resourceId },
        data: {
          catalogVisible: Boolean(input.catalogVisible),
          searchable: Boolean(input.searchable),
          privacy: privacy ?? 63,
          commentsPrivacy: commentsPrivacy,
          updatedAt: new Date(),
        },
      });
      break;
    }
    case "business": {
      const privacy = parsePrivacy(input.privacy ?? current.values.privacy);
      const expiresAt = parseDatetime(input.expiresAt ?? current.values.expiresAt);
      if (privacy === "invalid" || expiresAt === "invalid") {
        return { ok: false, reason: "invalid_privacy" };
      }
      const approved = Boolean(input.approved);
      await db.business.update({
        where: { id: resourceId },
        data: {
          catalogVisible: Boolean(input.catalogVisible),
          searchable: Boolean(input.searchable),
          featured: Boolean(input.featured),
          sponsored: Boolean(input.sponsored),
          approvedAt: approved ? new Date() : null,
          expiresAt,
          privacy: privacy ?? 63,
          updatedAt: new Date(),
        },
      });
      break;
    }
    case "article": {
      const privacy = parsePrivacy(input.privacy ?? current.values.privacy);
      const commentsPrivacy = parsePrivacy(input.commentsPrivacy ?? current.values.commentsPrivacy);
      if (privacy === "invalid" || commentsPrivacy === "invalid") {
        return { ok: false, reason: "invalid_privacy" };
      }
      await db.article.update({
        where: { id: resourceId },
        data: {
          catalogVisible: Boolean(input.catalogVisible),
          searchable: Boolean(input.searchable),
          draft: Boolean(input.draft),
          approved: Boolean(input.approved),
          featured: Boolean(input.featured),
          privacy: privacy ?? 0,
          commentsPrivacy: commentsPrivacy,
          updatedAt: new Date(),
        },
      });
      break;
    }
    case "forum-topic":
      await db.forumPost.update({
        where: { id: resourceId },
        data: {
          isLocked: Boolean(input.isLocked),
          isSticky: Boolean(input.isSticky),
          isAnnouncement: Boolean(input.isAnnouncement),
          modifiedAt: new Date(),
        },
      });
      break;
    case "forum-category":
      await db.forumCategory.update({
        where: { id: resourceId },
        data: {
          isLocked: Boolean(input.isLocked),
          publicCanRead: Boolean(input.publicCanRead),
        },
      });
      break;
    case "user-profile": {
      const profilePrivacy = parsePrivacy(input.profilePrivacy ?? current.values.profilePrivacy);
      const commentsPrivacy = parsePrivacy(input.commentsPrivacy ?? current.values.commentsPrivacy);
      if (profilePrivacy === "invalid" || commentsPrivacy === "invalid") {
        return { ok: false, reason: "invalid_privacy" };
      }
      const enabled = Boolean(input.enabled);
      const verified = Boolean(input.verified);
      await db.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: resourceId },
          data: {
            enabled,
            verifiedAt: verified ? new Date() : null,
            ...(verified
              ? { verificationTokenHash: null, verificationSentAt: null }
              : {}),
            profilePrivacy: profilePrivacy ?? 63,
            commentsPrivacy: commentsPrivacy ?? 63,
            saveProfileViews: Boolean(input.saveProfileViews),
          },
        });
        if (!enabled) {
          await tx.authSession.deleteMany({ where: { userId: resourceId } });
        }
      });
      break;
    }
  }

  const afterSnapshot = await getAdminModuleFlags(kind, resourceId);
  const after = afterSnapshot?.values ?? {};
  const serializedAfter = Object.fromEntries(
    Object.entries(after).map(([key, value]) => [key, serializeValue(value)]),
  );
  const serializedBefore = Object.fromEntries(
    Object.entries(before).map(([key, value]) => [key, serializeValue(value)]),
  );

  return { ok: true, changes: diffChanges(serializedBefore, serializedAfter) };
}

export function adminModuleRevalidatePaths(kind: AdminModuleKind, resourceId: string): string[] {
  const paths = [`/admin/${kindToAdminSegment(kind)}/${resourceId}`];
  switch (kind) {
    case "group":
      return [...paths, "/admin/groups", "/groups", `/groups/${resourceId}`];
    case "event":
      return [...paths, "/admin/events", "/events", `/events/${resourceId}`];
    case "poll":
      return [...paths, "/admin/polls", "/polls", `/polls/${resourceId}`];
    case "album":
      return [...paths, "/admin/albums", "/albums", `/albums/${resourceId}`];
    case "classified":
      return [...paths, "/admin/classifieds", "/classifieds", `/classifieds/${resourceId}`];
    case "blog":
      return [...paths, "/admin/blogs", "/blogs", `/blogs/${resourceId}`];
    case "business":
      return [...paths, "/admin/businesses", "/businesses", `/businesses/${resourceId}`];
    case "article":
      return [...paths, "/admin/articles", "/articles", `/articles/${resourceId}`];
    case "forum-topic":
      return [
        ...paths,
        `/admin/forum/topics/${resourceId}`,
        "/admin/forum",
        "/forum",
      ];
    case "forum-category":
      return [
        ...paths,
        `/admin/forum/categories/${resourceId}`,
        "/admin/forum",
        "/forum",
      ];
    case "user-profile":
      return [...paths, "/admin/users", `/admin/users/${resourceId}`];
    default:
      return paths;
  }
}

function kindToAdminSegment(kind: AdminModuleKind): string {
  if (kind === "forum-topic") return "forum/topics";
  if (kind === "forum-category") return "forum/categories";
  if (kind === "user-profile") return "users";
  return kind === "blog" ? "blogs" : `${kind}s`;
}
