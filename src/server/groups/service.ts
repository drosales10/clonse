import { Prisma } from "@prisma/client";

import {
  GROUP_PAGE_SIZE,
  canReadGroup,
  normalizeGroupQuery,
  type GroupCatalogQuery,
  type GroupCatalogResult,
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

  return {
    ...toPublicGroup(row),
    description: toSafeText(row.description),
    categoryId: row.categoryId,
    catalogVisible: row.catalogVisible,
    isOwner: viewerId === row.ownerId,
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
  const group = await db.group.create({
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
