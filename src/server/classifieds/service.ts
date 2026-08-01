import { Prisma } from "@prisma/client";

import {
  CLASSIFIED_PAGE_SIZE,
  canReadClassified,
  normalizeClassifiedQuery,
  type ClassifiedCatalogQuery,
  type ClassifiedCatalogResult,
  type PublicClassified,
} from "@domain/classifieds";
import { db } from "@/server/db/client";

const classifiedSelect = {
  id: true,
  legacyId: true,
  slug: true,
  title: true,
  body: true,
  searchable: true,
  privacy: true,
  views: true,
  totalComments: true,
  createdAt: true,
  updatedAt: true,
  ownerId: true,
  owner: { select: { username: true, displayName: true, enabled: true } },
  category: { select: { id: true, legacyId: true, title: true } },
} satisfies Prisma.ClassifiedSelect;

type ClassifiedRow = Prisma.ClassifiedGetPayload<{ select: typeof classifiedSelect }>;

type CategoryRow = { id: string; legacyId: number | null; parentId: string | null; title: string };

export async function getClassifiedCatalog(
  viewerId: string | null,
  input: Partial<ClassifiedCatalogQuery> = {},
): Promise<ClassifiedCatalogResult> {
  const query = normalizeClassifiedQuery(input);
  const categories = await db.classifiedCategory.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: { id: true, legacyId: true, parentId: true, title: true },
  });
  const categoryIds = resolveCategoryIds(categories, query.categoryId);

  const rows = await db.classified.findMany({
    where: {
      searchable: true,
      owner: { enabled: true },
      ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: "insensitive" } },
              { body: { contains: query.search, mode: "insensitive" } },
              { slug: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: classifiedOrder(query.sort),
    select: classifiedSelect,
  });

  const visible = rows.filter((row) => row.searchable && canReadClassified(row.ownerId, row.privacy, viewerId));
  const pageCount = Math.max(1, Math.ceil(visible.length / CLASSIFIED_PAGE_SIZE));
  const page = Math.min(query.page, pageCount);
  const startIndex = (page - 1) * CLASSIFIED_PAGE_SIZE;
  const items = visible.slice(startIndex, startIndex + CLASSIFIED_PAGE_SIZE).map(toPublicClassified);

  return {
    items,
    pagination: {
      page,
      pageSize: CLASSIFIED_PAGE_SIZE,
      total: visible.length,
      pageCount,
      start: visible.length === 0 ? 0 : startIndex + 1,
      end: Math.min(startIndex + CLASSIFIED_PAGE_SIZE, visible.length),
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

function classifiedOrder(sort: ClassifiedCatalogQuery["sort"]): Prisma.ClassifiedOrderByWithRelationInput[] {
  const primary: Prisma.ClassifiedOrderByWithRelationInput = sort === "updated"
    ? { updatedAt: "desc" }
    : sort === "views"
      ? { views: "desc" }
      : sort === "comments"
        ? { totalComments: "desc" }
        : { createdAt: "desc" };
  return [primary, { id: "asc" }];
}

function toPublicClassified(row: ClassifiedRow): PublicClassified {
  return {
    id: row.id,
    legacyId: row.legacyId,
    slug: row.slug,
    title: row.title,
    body: row.body,
    views: row.views,
    totalComments: row.totalComments,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    owner: { username: row.owner.username, displayName: row.owner.displayName },
    category: row.category,
  };
}
