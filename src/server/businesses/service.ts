import { Prisma } from "@prisma/client";

import {
  BUSINESS_PAGE_SIZE,
  canReadBusiness,
  isBusinessAvailable,
  normalizeBusinessQuery,
  type BusinessCatalogQuery,
  type BusinessCatalogResult,
  type PublicBusiness,
} from "@domain/businesses";
import { db } from "@/server/db/client";

const businessSelect = {
  id: true,
  legacyId: true,
  slug: true,
  title: true,
  summary: true,
  city: true,
  province: true,
  country: true,
  postalCode: true,
  featured: true,
  sponsored: true,
  searchable: true,
  privacy: true,
  approvedAt: true,
  rating: true,
  weightedRating: true,
  views: true,
  totalComments: true,
  createdAt: true,
  updatedAt: true,
  expiresAt: true,
  ownerId: true,
  owner: { select: { username: true, displayName: true, enabled: true } },
  category: { select: { id: true, legacyId: true, title: true } },
} satisfies Prisma.BusinessSelect;

type BusinessRow = Prisma.BusinessGetPayload<{ select: typeof businessSelect }>;

export async function getBusinessCatalog(
  viewerId: string | null,
  input: Partial<BusinessCatalogQuery> = {},
): Promise<BusinessCatalogResult> {
  const query = normalizeBusinessQuery(input);
  const categories = await db.businessCategory.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: { id: true, legacyId: true, parentId: true, title: true },
  });

  const categoryIds = resolveCategoryIds(categories, query.categoryId);
  const rows = await db.business.findMany({
    where: {
      searchable: true,
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
  const visible = rows.filter((row) =>
    isBusinessAvailable(row.searchable, row.approvedAt, row.expiresAt, now)
    && canReadBusiness(row.ownerId, row.privacy, viewerId),
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
  const primary: Prisma.BusinessOrderByWithRelationInput = sort === "updated"
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
