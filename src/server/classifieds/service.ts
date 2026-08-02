import { Prisma } from "@prisma/client";

import {
  CLASSIFIED_PAGE_SIZE,
  canReadClassified,
  normalizeClassifiedQuery,
  type ClassifiedCatalogQuery,
  type ClassifiedCatalogResult,
  type PublicClassified,
  type PublicClassifiedDetail,
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
  catalogVisible: true,
  views: true,
  totalComments: true,
  createdAt: true,
  updatedAt: true,
  ownerId: true,
  categoryId: true,
  owner: { select: { username: true, displayName: true, enabled: true } },
  category: { select: { id: true, legacyId: true, title: true } },
} satisfies Prisma.ClassifiedSelect;

type ClassifiedRow = Prisma.ClassifiedGetPayload<{ select: typeof classifiedSelect }>;
type CategoryRow = { id: string; legacyId: number | null; parentId: string | null; title: string };

export async function listActiveClassifiedCategories(): Promise<CategoryRow[]> {
  return db.classifiedCategory.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: { id: true, legacyId: true, parentId: true, title: true },
  });
}

export async function getClassifiedCatalog(
  viewerId: string | null,
  input: Partial<ClassifiedCatalogQuery> = {},
): Promise<ClassifiedCatalogResult> {
  const query = normalizeClassifiedQuery(input);
  const categories = await listActiveClassifiedCategories();
  const categoryIds = resolveCategoryIds(categories, query.categoryId);

  const rows = await db.classified.findMany({
    where: {
      searchable: true,
      catalogVisible: true,
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

  const visible = rows.filter((row) =>
    canReadClassified(row.ownerId, row.privacy, row.catalogVisible, viewerId),
  );
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

export async function getClassifiedDetail(
  viewerId: string | null,
  identifier: string,
): Promise<PublicClassifiedDetail | null> {
  const normalizedIdentifier = identifier.trim();
  if (!normalizedIdentifier) return null;

  const legacyId = /^\d+$/.test(normalizedIdentifier) ? Number(normalizedIdentifier) : null;
  const row = await db.classified.findFirst({
    where: {
      AND: [
        {
          OR: [
            { id: normalizedIdentifier },
            { slug: normalizedIdentifier },
            ...(legacyId !== null && legacyId > 0 ? [{ legacyId }] : []),
          ],
        },
        { owner: { enabled: true } },
      ],
    },
    select: classifiedSelect,
  });

  if (!row || !canReadClassified(row.ownerId, row.privacy, row.catalogVisible, viewerId)) return null;

  return {
    ...toPublicClassified(row),
    body: toSafeText(row.body),
    categoryId: row.categoryId,
    catalogVisible: row.catalogVisible,
    isOwner: viewerId === row.ownerId,
  };
}

export type CreateClassifiedResult =
  | { ok: true; id: string }
  | { ok: false; reason: "unauthorized" | "invalid_category" };

export async function createClassified(
  ownerId: string,
  input: { title: string; body: string | null; categoryId: string | null },
): Promise<CreateClassifiedResult> {
  const owner = await requireActiveOwner(ownerId);
  if (!owner) return { ok: false, reason: "unauthorized" };

  if (input.categoryId) {
    const category = await db.classifiedCategory.findFirst({
      where: { id: input.categoryId, active: true },
      select: { id: true },
    });
    if (!category) return { ok: false, reason: "invalid_category" };
  }

  const now = new Date();
  const classified = await db.classified.create({
    data: {
      ownerId: owner.id,
      title: input.title,
      body: input.body,
      categoryId: input.categoryId,
      createdAt: now,
      updatedAt: now,
      searchable: true,
      catalogVisible: true,
      privacy: 63,
      views: 0,
      totalComments: 0,
    },
    select: { id: true },
  });
  return { ok: true, id: classified.id };
}

export type UpdateClassifiedResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "forbidden" | "invalid_category" };

export async function updateOwnClassified(
  ownerId: string,
  classifiedId: string,
  input: { title: string; body: string | null; categoryId: string | null },
): Promise<UpdateClassifiedResult> {
  const classified = await db.classified.findUnique({
    where: { id: classifiedId },
    select: { id: true, ownerId: true },
  });
  if (!classified) return { ok: false, reason: "not_found" };
  if (classified.ownerId !== ownerId) return { ok: false, reason: "forbidden" };

  if (input.categoryId) {
    const category = await db.classifiedCategory.findFirst({
      where: { id: input.categoryId, active: true },
      select: { id: true },
    });
    if (!category) return { ok: false, reason: "invalid_category" };
  }

  await db.classified.update({
    where: { id: classified.id },
    data: {
      title: input.title,
      body: input.body,
      categoryId: input.categoryId,
      updatedAt: new Date(),
    },
  });
  return { ok: true };
}

export type SetClassifiedVisibleResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "forbidden" };

export async function setOwnClassifiedCatalogVisible(
  ownerId: string,
  classifiedId: string,
  catalogVisible: boolean,
): Promise<SetClassifiedVisibleResult> {
  const classified = await db.classified.findUnique({
    where: { id: classifiedId },
    select: { id: true, ownerId: true },
  });
  if (!classified) return { ok: false, reason: "not_found" };
  if (classified.ownerId !== ownerId) return { ok: false, reason: "forbidden" };

  await db.classified.update({
    where: { id: classified.id },
    data: {
      catalogVisible,
      searchable: catalogVisible ? true : undefined,
      updatedAt: new Date(),
    },
  });
  return { ok: true };
}

async function requireActiveOwner(ownerId: string) {
  return db.user
    .findUnique({
      where: { id: ownerId },
      select: { id: true, enabled: true, verifiedAt: true },
    })
    .then((user) => (user?.enabled && user.verifiedAt ? user : null));
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
  const primary: Prisma.ClassifiedOrderByWithRelationInput =
    sort === "updated"
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
