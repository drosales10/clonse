import { Prisma } from "@prisma/client";

import {
  BUSINESS_PAGE_SIZE,
  canReadBusiness,
  isBusinessAvailable,
  normalizeBusinessQuery,
  type BusinessCatalogQuery,
  type BusinessCatalogResult,
  type PublicBusiness,
  type PublicBusinessDetail,
} from "@domain/businesses";
import { db } from "@/server/db/client";

const businessSelect = {
  id: true,
  legacyId: true,
  slug: true,
  title: true,
  summary: true,
  description: true,
  city: true,
  province: true,
  country: true,
  postalCode: true,
  featured: true,
  sponsored: true,
  searchable: true,
  privacy: true,
  catalogVisible: true,
  approvedAt: true,
  rating: true,
  weightedRating: true,
  views: true,
  totalComments: true,
  createdAt: true,
  updatedAt: true,
  expiresAt: true,
  ownerId: true,
  categoryId: true,
  owner: { select: { username: true, displayName: true, enabled: true } },
  category: { select: { id: true, legacyId: true, title: true } },
} satisfies Prisma.BusinessSelect;

type BusinessRow = Prisma.BusinessGetPayload<{ select: typeof businessSelect }>;
type CategoryRow = { id: string; legacyId: number | null; parentId: string | null; title: string };

export async function listActiveBusinessCategories(): Promise<CategoryRow[]> {
  return db.businessCategory.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: { id: true, legacyId: true, parentId: true, title: true },
  });
}

export async function getBusinessCatalog(
  viewerId: string | null,
  input: Partial<BusinessCatalogQuery> = {},
): Promise<BusinessCatalogResult> {
  const query = normalizeBusinessQuery(input);
  const categories = await listActiveBusinessCategories();
  const categoryIds = resolveCategoryIds(categories, query.categoryId);
  const rows = await db.business.findMany({
    where: {
      searchable: true,
      catalogVisible: true,
      approvedAt: { not: null },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      owner: { enabled: true },
      ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: "insensitive" } },
              { summary: { contains: query.search, mode: "insensitive" } },
              { city: { contains: query.search, mode: "insensitive" } },
              { province: { contains: query.search, mode: "insensitive" } },
              { country: { contains: query.search, mode: "insensitive" } },
              { slug: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: businessOrder(query.sort),
    select: businessSelect,
  });

  const now = new Date();
  const visible = rows.filter(
    (row) =>
      isBusinessAvailable(row.searchable, row.approvedAt, row.expiresAt, now) &&
      canReadBusiness(row.ownerId, row.privacy, row.catalogVisible, viewerId),
  );
  const pageCount = Math.max(1, Math.ceil(visible.length / BUSINESS_PAGE_SIZE));
  const page = Math.min(query.page, pageCount);
  const startIndex = (page - 1) * BUSINESS_PAGE_SIZE;
  const items = visible.slice(startIndex, startIndex + BUSINESS_PAGE_SIZE).map(toPublicBusiness);

  return {
    items,
    pagination: {
      page,
      pageSize: BUSINESS_PAGE_SIZE,
      total: visible.length,
      pageCount,
      start: visible.length === 0 ? 0 : startIndex + 1,
      end: Math.min(startIndex + BUSINESS_PAGE_SIZE, visible.length),
    },
    categories,
  };
}

export async function getBusinessDetail(
  viewerId: string | null,
  businessIdentifier: string,
): Promise<PublicBusinessDetail | null> {
  const legacyId = parseLegacyBusinessId(businessIdentifier);
  const row = await db.business.findFirst({
    where: {
      AND: [
        {
          OR: [
            { id: businessIdentifier },
            { slug: businessIdentifier },
            ...(legacyId === null ? [] : [{ legacyId }]),
          ],
        },
        { owner: { enabled: true } },
      ],
    },
    select: businessSelect,
  });
  if (!row) return null;
  if (!canReadBusiness(row.ownerId, row.privacy, row.catalogVisible, viewerId)) return null;

  const isOwner = viewerId === row.ownerId;
  const now = new Date();
  if (!isOwner && !isBusinessAvailable(row.searchable, row.approvedAt, row.expiresAt, now)) return null;

  return {
    ...toPublicBusiness(row),
    description: toSafeText(row.description ?? row.summary),
    phone: null,
    url: row.slug ? `/${row.slug}` : null,
    categoryId: row.categoryId,
    catalogVisible: row.catalogVisible,
    isOwner,
  };
}

export type CreateBusinessResult =
  | { ok: true; id: string }
  | { ok: false; reason: "unauthorized" | "invalid_category" };

export async function createBusiness(
  ownerId: string,
  input: {
    title: string;
    summary: string | null;
    description: string | null;
    city: string | null;
    province: string | null;
    country: string | null;
    categoryId: string | null;
  },
): Promise<CreateBusinessResult> {
  const owner = await requireActiveOwner(ownerId);
  if (!owner) return { ok: false, reason: "unauthorized" };

  if (input.categoryId) {
    const category = await db.businessCategory.findFirst({
      where: { id: input.categoryId, active: true },
      select: { id: true },
    });
    if (!category) return { ok: false, reason: "invalid_category" };
  }

  const now = new Date();
  const business = await db.business.create({
    data: {
      ownerId: owner.id,
      title: input.title,
      summary: input.summary,
      description: input.description,
      city: input.city,
      province: input.province,
      country: input.country,
      categoryId: input.categoryId,
      createdAt: now,
      updatedAt: now,
      approvedAt: now,
      searchable: true,
      catalogVisible: true,
      privacy: 63,
      views: 0,
      totalComments: 0,
    },
    select: { id: true },
  });
  return { ok: true, id: business.id };
}

export type UpdateBusinessResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "forbidden" | "invalid_category" };

export async function updateOwnBusiness(
  ownerId: string,
  businessId: string,
  input: {
    title: string;
    summary: string | null;
    description: string | null;
    city: string | null;
    province: string | null;
    country: string | null;
    categoryId: string | null;
  },
): Promise<UpdateBusinessResult> {
  const business = await db.business.findUnique({
    where: { id: businessId },
    select: { id: true, ownerId: true },
  });
  if (!business) return { ok: false, reason: "not_found" };
  if (business.ownerId !== ownerId) return { ok: false, reason: "forbidden" };

  if (input.categoryId) {
    const category = await db.businessCategory.findFirst({
      where: { id: input.categoryId, active: true },
      select: { id: true },
    });
    if (!category) return { ok: false, reason: "invalid_category" };
  }

  await db.business.update({
    where: { id: business.id },
    data: {
      title: input.title,
      summary: input.summary,
      description: input.description,
      city: input.city,
      province: input.province,
      country: input.country,
      categoryId: input.categoryId,
      updatedAt: new Date(),
    },
  });
  return { ok: true };
}

export type SetBusinessVisibleResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "forbidden" };

export async function setOwnBusinessCatalogVisible(
  ownerId: string,
  businessId: string,
  catalogVisible: boolean,
): Promise<SetBusinessVisibleResult> {
  const business = await db.business.findUnique({
    where: { id: businessId },
    select: { id: true, ownerId: true },
  });
  if (!business) return { ok: false, reason: "not_found" };
  if (business.ownerId !== ownerId) return { ok: false, reason: "forbidden" };

  await db.business.update({
    where: { id: business.id },
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

function resolveCategoryIds(
  categories: Array<{ id: string; parentId: string | null }>,
  selectedId: string | null,
): string[] | null {
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

function businessOrder(sort: BusinessCatalogQuery["sort"]): Prisma.BusinessOrderByWithRelationInput[] {
  const primary: Prisma.BusinessOrderByWithRelationInput =
    sort === "updated"
      ? { updatedAt: "desc" }
      : sort === "rating"
        ? { weightedRating: "desc" }
        : sort === "views"
          ? { views: "desc" }
          : sort === "comments"
            ? { totalComments: "desc" }
            : { createdAt: "desc" };
  return [{ sponsored: "desc" }, { featured: "desc" }, primary, { id: "asc" }];
}

function toPublicBusiness(row: BusinessRow): PublicBusiness {
  return {
    id: row.id,
    legacyId: row.legacyId,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    city: row.city,
    province: row.province,
    country: row.country,
    postalCode: row.postalCode,
    featured: row.featured,
    sponsored: row.sponsored,
    views: row.views,
    totalComments: row.totalComments,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    expiresAt: row.expiresAt,
    owner: { username: row.owner.username, displayName: row.owner.displayName },
    category: row.category,
  };
}

function parseLegacyBusinessId(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function toSafeText(value: string | null): string | null {
  if (!value) return null;
  const text = value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text || null;
}
