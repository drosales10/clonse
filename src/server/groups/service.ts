import { Prisma } from "@prisma/client";

import {
  GROUP_MEMBER_RANK,
  GROUP_MEMBER_STATUS,
  GROUP_PAGE_SIZE,
  MEMBER_LIST_PAGE_SIZE,
  canReadGroup,
  normalizeGroupQuery,
  normalizeMemberListPage,
  resolveGroupMembership,
  type GroupCatalogQuery,
  type GroupCatalogResult,
  type GroupMemberListResult,
  type GroupPendingListResult,
  type PublicGroup,
  type PublicGroupDetail,
} from "@domain/groups";
import { db } from "@/server/db/client";

const groupSelect = {
  id: true,
  legacyId: true,
  title: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  searchable: true,
  catalogVisible: true,
  views: true,
  ownerId: true,
  categoryId: true,
  membershipApprovalRequired: true,
  owner: { select: { username: true, displayName: true, enabled: true } },
  category: { select: { id: true, legacyId: true, title: true } },
} satisfies Prisma.GroupSelect;

type GroupRow = Prisma.GroupGetPayload<{ select: typeof groupSelect }>;
type CategoryRow = { id: string; legacyId: number | null; parentId: string | null; title: string };

export async function listActiveGroupCategories(): Promise<CategoryRow[]> {
  return db.groupCategory.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: { id: true, legacyId: true, parentId: true, title: true },
  });
}

export async function getGroupCatalog(
  viewerId: string | null,
  input: Partial<GroupCatalogQuery> = {},
): Promise<GroupCatalogResult> {
  const query = normalizeGroupQuery(input);
  const categories = await listActiveGroupCategories();
  const categoryIds = resolveCategoryIds(categories, query.categoryId);
  const rows = await db.group.findMany({
    where: {
      searchable: true,
      catalogVisible: true,
      owner: { enabled: true },
      ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    select: groupSelect,
  });

  const visible = rows.filter((row) => canReadGroup(row.ownerId, row.catalogVisible, viewerId));
  const pageCount = Math.max(1, Math.ceil(visible.length / GROUP_PAGE_SIZE));
  const page = Math.min(query.page, pageCount);
  const startIndex = (page - 1) * GROUP_PAGE_SIZE;
  const items = visible.slice(startIndex, startIndex + GROUP_PAGE_SIZE).map(toPublicGroup);

  return {
    items,
    pagination: {
      page,
      pageSize: GROUP_PAGE_SIZE,
      total: visible.length,
      pageCount,
      start: visible.length === 0 ? 0 : startIndex + 1,
      end: Math.min(startIndex + GROUP_PAGE_SIZE, visible.length),
    },
    categories,
  };
}

export async function getGroupDetail(
  viewerId: string | null,
  identifier: string,
): Promise<PublicGroupDetail | null> {
  const normalizedIdentifier = identifier.trim();
  if (!normalizedIdentifier) return null;

  const legacyId = /^\d+$/.test(normalizedIdentifier) ? Number(normalizedIdentifier) : null;
  const row = await db.group.findFirst({
    where: {
      AND: [
        {
          OR: [
            { id: normalizedIdentifier },
            ...(legacyId !== null && legacyId > 0 ? [{ legacyId }] : []),
          ],
        },
        { owner: { enabled: true } },
      ],
    },
    select: groupSelect,
  });

  if (!row || !canReadGroup(row.ownerId, row.catalogVisible, viewerId)) return null;

  const isOwner = viewerId === row.ownerId;
  const [memberCount, pendingCount, membershipRow] = await Promise.all([
    db.groupMember.count({
      where: { groupId: row.id, status: GROUP_MEMBER_STATUS.ACTIVE, approved: true },
    }),
    isOwner
      ? db.groupMember.count({
          where: { groupId: row.id, status: GROUP_MEMBER_STATUS.ACTIVE, approved: false },
        })
      : Promise.resolve(0),
    viewerId && !isOwner
      ? db.groupMember.findUnique({
          where: { groupId_userId: { groupId: row.id, userId: viewerId } },
          select: { approved: true, status: true },
        })
      : Promise.resolve(null),
  ]);

  const membership = resolveGroupMembership(isOwner, membershipRow);
  const canJoin = Boolean(viewerId) && !isOwner && membership === "none";

  return {
    ...toPublicGroup(row),
    description: toSafeText(row.description),
    categoryId: row.categoryId,
    catalogVisible: row.catalogVisible,
    membershipApprovalRequired: row.membershipApprovalRequired,
    isOwner,
    memberCount,
    pendingCount,
    membership,
    canJoin,
  };
}

export type CreateGroupResult =
  | { ok: true; id: string }
  | { ok: false; reason: "unauthorized" | "invalid_category" };

export async function createGroup(
  ownerId: string,
  input: { title: string; description: string | null; categoryId: string | null },
): Promise<CreateGroupResult> {
  const owner = await requireActiveOwner(ownerId);
  if (!owner) return { ok: false, reason: "unauthorized" };

  if (input.categoryId) {
    const category = await db.groupCategory.findFirst({
      where: { id: input.categoryId, active: true },
      select: { id: true },
    });
    if (!category) return { ok: false, reason: "invalid_category" };
  }

  const now = new Date();
  const group = await db.$transaction(async (tx) => {
    const created = await tx.group.create({
      data: {
        ownerId: owner.id,
        title: input.title,
        description: input.description,
        categoryId: input.categoryId,
        createdAt: now,
        updatedAt: now,
        searchable: true,
        catalogVisible: true,
        views: 0,
      },
      select: { id: true },
    });
    await tx.groupMember.create({
      data: {
        groupId: created.id,
        userId: owner.id,
        status: GROUP_MEMBER_STATUS.ACTIVE,
        approved: true,
        rank: GROUP_MEMBER_RANK.OWNER,
      },
    });
    return created;
  });
  return { ok: true, id: group.id };
}

export type UpdateGroupResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "forbidden" | "invalid_category" };

export async function updateOwnGroup(
  ownerId: string,
  groupId: string,
  input: { title: string; description: string | null; categoryId: string | null },
): Promise<UpdateGroupResult> {
  const group = await db.group.findUnique({
    where: { id: groupId },
    select: { id: true, ownerId: true },
  });
  if (!group) return { ok: false, reason: "not_found" };
  if (group.ownerId !== ownerId) return { ok: false, reason: "forbidden" };

  if (input.categoryId) {
    const category = await db.groupCategory.findFirst({
      where: { id: input.categoryId, active: true },
      select: { id: true },
    });
    if (!category) return { ok: false, reason: "invalid_category" };
  }

  await db.group.update({
    where: { id: group.id },
    data: {
      title: input.title,
      description: input.description,
      categoryId: input.categoryId,
      updatedAt: new Date(),
    },
  });
  return { ok: true };
}

export type SetGroupVisibleResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "forbidden" };

export async function setOwnGroupCatalogVisible(
  ownerId: string,
  groupId: string,
  catalogVisible: boolean,
): Promise<SetGroupVisibleResult> {
  const group = await db.group.findUnique({
    where: { id: groupId },
    select: { id: true, ownerId: true },
  });
  if (!group) return { ok: false, reason: "not_found" };
  if (group.ownerId !== ownerId) return { ok: false, reason: "forbidden" };

  await db.group.update({
    where: { id: group.id },
    data: {
      catalogVisible,
      searchable: catalogVisible ? true : undefined,
      updatedAt: new Date(),
    },
  });
  return { ok: true };
}

export type JoinGroupResult =
  | { ok: true; pending: boolean }
  | { ok: false; reason: "not_found" | "forbidden" | "already_member" | "unauthorized" };

export async function joinGroup(viewerId: string, groupId: string): Promise<JoinGroupResult> {
  const viewer = await db.user.findUnique({
    where: { id: viewerId },
    select: { id: true, enabled: true },
  });
  if (!viewer?.enabled) return { ok: false, reason: "unauthorized" };

  const group = await db.group.findFirst({
    where: { id: groupId, owner: { enabled: true } },
    select: { id: true, ownerId: true, catalogVisible: true, membershipApprovalRequired: true },
  });
  if (!group || !canReadGroup(group.ownerId, group.catalogVisible, viewerId)) {
    return { ok: false, reason: "not_found" };
  }
  if (group.ownerId === viewerId) return { ok: false, reason: "forbidden" };

  const existing = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId: group.id, userId: viewerId } },
    select: { id: true, approved: true, status: true },
  });
  if (existing) {
    const state = resolveGroupMembership(false, existing);
    if (state === "pending" || state === "invited" || state === "member") {
      return { ok: false, reason: "already_member" };
    }
  }

  const pending = group.membershipApprovalRequired;
  try {
    await db.groupMember.create({
      data: {
        groupId: group.id,
        userId: viewerId,
        status: GROUP_MEMBER_STATUS.ACTIVE,
        approved: !pending,
        rank: GROUP_MEMBER_RANK.MEMBER,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, reason: "already_member" };
    }
    throw error;
  }
  return { ok: true, pending };
}

export type LeaveGroupResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "forbidden" | "not_member" | "unauthorized" };

export async function leaveGroup(viewerId: string, groupId: string): Promise<LeaveGroupResult> {
  const viewer = await db.user.findUnique({
    where: { id: viewerId },
    select: { id: true, enabled: true },
  });
  if (!viewer?.enabled) return { ok: false, reason: "unauthorized" };

  const group = await db.group.findUnique({
    where: { id: groupId },
    select: { id: true, ownerId: true },
  });
  if (!group) return { ok: false, reason: "not_found" };
  if (group.ownerId === viewerId) return { ok: false, reason: "forbidden" };

  const membership = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId: group.id, userId: viewerId } },
    select: { id: true },
  });
  if (!membership) return { ok: false, reason: "not_member" };

  await db.groupMember.delete({ where: { id: membership.id } });
  return { ok: true };
}

export async function getGroupMembers(
  viewerId: string | null,
  groupId: string,
  pageInput: unknown,
): Promise<GroupMemberListResult | null> {
  const group = await db.group.findFirst({
    where: { id: groupId, owner: { enabled: true } },
    select: { id: true, ownerId: true, catalogVisible: true },
  });
  if (!group || !canReadGroup(group.ownerId, group.catalogVisible, viewerId)) return null;

  const page = normalizeMemberListPage(pageInput);
  const where = {
    groupId: group.id,
    status: GROUP_MEMBER_STATUS.ACTIVE,
    approved: true,
    user: { enabled: true },
  };
  const total = await db.groupMember.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / MEMBER_LIST_PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const startIndex = (safePage - 1) * MEMBER_LIST_PAGE_SIZE;
  const rows = await db.groupMember.findMany({
    where,
    orderBy: [{ rank: "desc" }, { createdAt: "asc" }, { id: "asc" }],
    skip: startIndex,
    take: MEMBER_LIST_PAGE_SIZE,
    select: {
      rank: true,
      createdAt: true,
      user: { select: { username: true, displayName: true } },
    },
  });

  return {
    items: rows.map((row) => ({
      user: row.user,
      rank: row.rank,
      joinedAt: row.createdAt,
    })),
    pagination: {
      page: safePage,
      pageSize: MEMBER_LIST_PAGE_SIZE,
      total,
      pageCount,
      start: total === 0 ? 0 : startIndex + 1,
      end: Math.min(startIndex + MEMBER_LIST_PAGE_SIZE, total),
    },
  };
}

export async function getGroupPendingMembers(
  ownerId: string,
  groupId: string,
): Promise<GroupPendingListResult | null> {
  const group = await db.group.findUnique({
    where: { id: groupId },
    select: { id: true, ownerId: true },
  });
  if (!group || group.ownerId !== ownerId) return null;

  const rows = await db.groupMember.findMany({
    where: {
      groupId: group.id,
      status: GROUP_MEMBER_STATUS.ACTIVE,
      approved: false,
      user: { enabled: true },
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      userId: true,
      createdAt: true,
      user: { select: { username: true, displayName: true } },
    },
  });

  return {
    items: rows.map((row) => ({
      userId: row.userId,
      user: row.user,
      requestedAt: row.createdAt,
    })),
  };
}

export type ApproveGroupMemberResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "forbidden" | "invalid_member" };

export async function approveGroupMember(
  ownerId: string,
  groupId: string,
  memberUserId: string,
): Promise<ApproveGroupMemberResult> {
  const group = await db.group.findUnique({
    where: { id: groupId },
    select: { id: true, ownerId: true },
  });
  if (!group) return { ok: false, reason: "not_found" };
  if (group.ownerId !== ownerId) return { ok: false, reason: "forbidden" };

  const member = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId: group.id, userId: memberUserId } },
    select: { id: true, approved: true, status: true },
  });
  if (!member || member.status !== GROUP_MEMBER_STATUS.ACTIVE || member.approved) {
    return { ok: false, reason: "invalid_member" };
  }

  await db.groupMember.update({
    where: { id: member.id },
    data: { approved: true, updatedAt: new Date() },
  });
  return { ok: true };
}

export async function rejectGroupMember(
  ownerId: string,
  groupId: string,
  memberUserId: string,
): Promise<ApproveGroupMemberResult> {
  const group = await db.group.findUnique({
    where: { id: groupId },
    select: { id: true, ownerId: true },
  });
  if (!group) return { ok: false, reason: "not_found" };
  if (group.ownerId !== ownerId) return { ok: false, reason: "forbidden" };

  const member = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId: group.id, userId: memberUserId } },
    select: { id: true, rank: true, approved: true, status: true },
  });
  if (!member || member.rank === GROUP_MEMBER_RANK.OWNER) {
    return { ok: false, reason: "invalid_member" };
  }

  await db.groupMember.delete({ where: { id: member.id } });
  return { ok: true };
}

export type InviteGroupMemberResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "forbidden" | "user_not_found" | "already_member" };

export async function inviteGroupMember(
  ownerId: string,
  groupId: string,
  username: string,
): Promise<InviteGroupMemberResult> {
  const group = await db.group.findUnique({
    where: { id: groupId },
    select: { id: true, ownerId: true },
  });
  if (!group) return { ok: false, reason: "not_found" };
  if (group.ownerId !== ownerId) return { ok: false, reason: "forbidden" };

  const user = await db.user.findFirst({
    where: { username, enabled: true },
    select: { id: true },
  });
  if (!user) return { ok: false, reason: "user_not_found" };
  if (user.id === ownerId) return { ok: false, reason: "already_member" };

  const existing = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId: group.id, userId: user.id } },
    select: { id: true },
  });
  if (existing) return { ok: false, reason: "already_member" };

  await db.groupMember.create({
    data: {
      groupId: group.id,
      userId: user.id,
      status: GROUP_MEMBER_STATUS.INVITED,
      approved: true,
      rank: GROUP_MEMBER_RANK.MEMBER,
    },
  });
  return { ok: true };
}

export type RespondGroupInvitationResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "invalid_invitation" | "unauthorized" };

export async function acceptGroupInvitation(
  viewerId: string,
  groupId: string,
): Promise<RespondGroupInvitationResult> {
  const viewer = await db.user.findUnique({
    where: { id: viewerId },
    select: { id: true, enabled: true },
  });
  if (!viewer?.enabled) return { ok: false, reason: "unauthorized" };

  const member = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: viewerId } },
    select: { id: true, status: true, approved: true },
  });
  if (!member || member.status !== GROUP_MEMBER_STATUS.INVITED || !member.approved) {
    return { ok: false, reason: "invalid_invitation" };
  }

  await db.groupMember.update({
    where: { id: member.id },
    data: { status: GROUP_MEMBER_STATUS.ACTIVE, updatedAt: new Date() },
  });
  return { ok: true };
}

export async function declineGroupInvitation(
  viewerId: string,
  groupId: string,
): Promise<RespondGroupInvitationResult> {
  const viewer = await db.user.findUnique({
    where: { id: viewerId },
    select: { id: true, enabled: true },
  });
  if (!viewer?.enabled) return { ok: false, reason: "unauthorized" };

  const member = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: viewerId } },
    select: { id: true, status: true, rank: true },
  });
  if (!member || member.status !== GROUP_MEMBER_STATUS.INVITED || member.rank === GROUP_MEMBER_RANK.OWNER) {
    return { ok: false, reason: "invalid_invitation" };
  }

  await db.groupMember.delete({ where: { id: member.id } });
  return { ok: true };
}

export type SetGroupApprovalRequiredResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "forbidden" };

export async function setOwnGroupMembershipApprovalRequired(
  ownerId: string,
  groupId: string,
  membershipApprovalRequired: boolean,
): Promise<SetGroupApprovalRequiredResult> {
  const group = await db.group.findUnique({
    where: { id: groupId },
    select: { id: true, ownerId: true },
  });
  if (!group) return { ok: false, reason: "not_found" };
  if (group.ownerId !== ownerId) return { ok: false, reason: "forbidden" };

  await db.group.update({
    where: { id: group.id },
    data: { membershipApprovalRequired, updatedAt: new Date() },
  });
  return { ok: true };
}

async function requireActiveOwner(ownerId: string) {
  return db.user.findUnique({
    where: { id: ownerId },
    select: { id: true, enabled: true, verifiedAt: true },
  }).then((user) => (user?.enabled && user.verifiedAt ? user : null));
}

function resolveCategoryIds(categories: CategoryRow[], selectedId: string | null): string[] | null {
  if (!selectedId) return null;
  const selected = categories.find((category) => category.id === selectedId);
  if (!selected) return [];
  if (selected.parentId !== null) return [selected.id];

  const descendants = new Set([selected.id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const category of categories) {
      if (category.parentId && descendants.has(category.parentId) && !descendants.has(category.id)) {
        descendants.add(category.id);
        changed = true;
      }
    }
  }
  return [...descendants];
}

function toPublicGroup(row: GroupRow): PublicGroup {
  return {
    id: row.id,
    legacyId: row.legacyId,
    title: row.title,
    description: row.description,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    views: row.views,
    owner: { username: row.owner.username, displayName: row.owner.displayName },
    category: row.category,
  };
}

function toSafeText(value: string | null): string | null {
  if (!value) return null;
  const text = value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&#39;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .trim();
  return text || null;
}

