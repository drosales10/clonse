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
  owner: { select: { username: true, displayName: true, enabled: true } },
  category: { select: { id: true, legacyId: true, title: true } },
} satisfies Prisma.GroupSelect;

type GroupRow = Prisma.GroupGetPayload<{ select: typeof groupSelect }>;
type CategoryRow = { id: string; legacyId: number | null; parentId: string | null; title: string };

export async function getGroupCatalog(
  viewerId: string | null,
  input: Partial<GroupCatalogQuery> = {},
): Promise<GroupCatalogResult> {
  const query = normalizeGroupQuery(input);
  const categories = await db.groupCategory.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: { id: true, legacyId: true, parentId: true, title: true },
  });
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
