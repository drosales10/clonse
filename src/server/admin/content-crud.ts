import { GROUP_MEMBER_RANK, GROUP_MEMBER_STATUS } from "@domain/groups";

import { db } from "@/server/db/client";
import {
  defaultCatalogFlags,
  resolveAdminOwner,
  validateActiveCategory,
  type AdminCatalogFlags,
  type AdminContentMutationResult,
} from "@/server/admin/helpers";

const ownerSelect = { username: true, displayName: true } as const;

async function findGroupCategory(id: string) {
  return db.groupCategory.findFirst({ where: { id, active: true }, select: { id: true } });
}

async function findEventCategory(id: string) {
  return db.eventCategory.findFirst({ where: { id, active: true }, select: { id: true } });
}

async function findClassifiedCategory(id: string) {
  return db.classifiedCategory.findFirst({ where: { id, active: true }, select: { id: true } });
}

async function findBlogCategory(id: string) {
  return db.blogCategory.findFirst({ where: { id, active: true }, select: { id: true } });
}

async function findBusinessCategory(id: string) {
  return db.businessCategory.findFirst({ where: { id, active: true }, select: { id: true } });
}

async function findArticleCategory(id: string) {
  return db.articleCategory.findFirst({ where: { id, active: true }, select: { id: true } });
}

// ─── Groups ───────────────────────────────────────────────────────────────────

export interface AdminGroupDetail {
  id: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  catalogVisible: boolean;
  searchable: boolean;
  membershipApprovalRequired: boolean;
  views: number;
  createdAt: Date;
  updatedAt: Date;
  owner: { username: string; displayName: string };
  category: { id: string; title: string } | null;
}

export async function getAdminGroupDetail(groupId: string): Promise<AdminGroupDetail | null> {
  return db.group.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      title: true,
      description: true,
      categoryId: true,
      catalogVisible: true,
      searchable: true,
      membershipApprovalRequired: true,
      views: true,
      createdAt: true,
      updatedAt: true,
      owner: { select: ownerSelect },
      category: { select: { id: true, title: true } },
    },
  });
}

export async function createAdminGroup(
  ownerUsername: string,
  input: {
    title: string;
    description: string | null;
    categoryId: string | null;
    membershipApprovalRequired?: boolean;
  },
  flags: AdminCatalogFlags = defaultCatalogFlags(),
): Promise<AdminContentMutationResult> {
  const owner = await resolveAdminOwner(ownerUsername);
  if (!owner) return { ok: false, reason: "invalid_owner" };
  if (!(await validateActiveCategory(input.categoryId, findGroupCategory))) {
    return { ok: false, reason: "invalid_category" };
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
        searchable: flags.searchable,
        catalogVisible: flags.catalogVisible,
        membershipApprovalRequired: input.membershipApprovalRequired ?? false,
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

export async function updateAdminGroup(
  groupId: string,
  input: {
    title: string;
    description: string | null;
    categoryId: string | null;
    membershipApprovalRequired: boolean;
  },
  flags: AdminCatalogFlags,
): Promise<AdminContentMutationResult> {
  const group = await db.group.findUnique({ where: { id: groupId }, select: { id: true } });
  if (!group) return { ok: false, reason: "not_found" };
  if (!(await validateActiveCategory(input.categoryId, findGroupCategory))) {
    return { ok: false, reason: "invalid_category" };
  }
  await db.group.update({
    where: { id: group.id },
    data: {
      title: input.title,
      description: input.description,
      categoryId: input.categoryId,
      membershipApprovalRequired: input.membershipApprovalRequired,
      catalogVisible: flags.catalogVisible,
      searchable: flags.searchable,
      updatedAt: new Date(),
    },
  });
  return { ok: true };
}

export async function deleteAdminGroup(groupId: string): Promise<AdminContentMutationResult> {
  const group = await db.group.findUnique({ where: { id: groupId }, select: { id: true } });
  if (!group) return { ok: false, reason: "not_found" };
  await db.group.delete({ where: { id: group.id } });
  return { ok: true };
}

// ─── Events ───────────────────────────────────────────────────────────────────

export interface AdminEventDetail {
  id: string;
  title: string;
  description: string | null;
  host: string | null;
  location: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  categoryId: string | null;
  catalogVisible: boolean;
  searchable: boolean;
  inviteOnly: boolean;
  views: number;
  createdAt: Date;
  updatedAt: Date;
  owner: { username: string; displayName: string };
  category: { id: string; title: string } | null;
}

export async function getAdminEventDetail(eventId: string): Promise<AdminEventDetail | null> {
  return db.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      description: true,
      host: true,
      location: true,
      startsAt: true,
      endsAt: true,
      categoryId: true,
      catalogVisible: true,
      searchable: true,
      inviteOnly: true,
      views: true,
      createdAt: true,
      updatedAt: true,
      owner: { select: ownerSelect },
      category: { select: { id: true, title: true } },
    },
  });
}

export async function createAdminEvent(
  ownerUsername: string,
  input: {
    title: string;
    description: string | null;
    host: string | null;
    location: string | null;
    startsAt: Date | null;
    endsAt: Date | null;
    categoryId: string | null;
    inviteOnly?: boolean;
  },
  flags: AdminCatalogFlags = defaultCatalogFlags(),
): Promise<AdminContentMutationResult> {
  const owner = await resolveAdminOwner(ownerUsername);
  if (!owner) return { ok: false, reason: "invalid_owner" };
  if (!(await validateActiveCategory(input.categoryId, findEventCategory))) {
    return { ok: false, reason: "invalid_category" };
  }

  const now = new Date();
  const event = await db.event.create({
    data: {
      ownerId: owner.id,
      title: input.title,
      description: input.description,
      host: input.host,
      location: input.location,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      categoryId: input.categoryId,
      createdAt: now,
      updatedAt: now,
      searchable: flags.searchable,
      catalogVisible: flags.catalogVisible,
      inviteOnly: input.inviteOnly ?? false,
      views: 0,
    },
    select: { id: true },
  });
  return { ok: true, id: event.id };
}

export async function updateAdminEvent(
  eventId: string,
  input: {
    title: string;
    description: string | null;
    host: string | null;
    location: string | null;
    startsAt: Date | null;
    endsAt: Date | null;
    categoryId: string | null;
    inviteOnly: boolean;
  },
  flags: AdminCatalogFlags,
): Promise<AdminContentMutationResult> {
  const event = await db.event.findUnique({ where: { id: eventId }, select: { id: true } });
  if (!event) return { ok: false, reason: "not_found" };
  if (!(await validateActiveCategory(input.categoryId, findEventCategory))) {
    return { ok: false, reason: "invalid_category" };
  }
  await db.event.update({
    where: { id: event.id },
    data: {
      title: input.title,
      description: input.description,
      host: input.host,
      location: input.location,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      categoryId: input.categoryId,
      inviteOnly: input.inviteOnly,
      catalogVisible: flags.catalogVisible,
      searchable: flags.searchable,
      updatedAt: new Date(),
    },
  });
  return { ok: true };
}

export async function deleteAdminEvent(eventId: string): Promise<AdminContentMutationResult> {
  const event = await db.event.findUnique({ where: { id: eventId }, select: { id: true } });
  if (!event) return { ok: false, reason: "not_found" };
  await db.event.delete({ where: { id: event.id } });
  return { ok: true };
}

// ─── Polls ────────────────────────────────────────────────────────────────────

export interface AdminPollDetail {
  id: string;
  title: string;
  description: string | null;
  options: string[];
  closed: boolean;
  catalogVisible: boolean;
  searchable: boolean;
  totalVotes: number;
  views: number;
  createdAt: Date;
  updatedAt: Date;
  owner: { username: string; displayName: string };
}

export async function getAdminPollDetail(pollId: string): Promise<AdminPollDetail | null> {
  const row = await db.poll.findUnique({
    where: { id: pollId },
    select: {
      id: true,
      title: true,
      description: true,
      options: true,
      closed: true,
      catalogVisible: true,
      searchable: true,
      totalVotes: true,
      views: true,
      createdAt: true,
      updatedAt: true,
      owner: { select: ownerSelect },
    },
  });
  if (!row) return null;
  const options = Array.isArray(row.options)
    ? row.options.filter((item): item is string => typeof item === "string")
    : [];
  return { ...row, options };
}

export async function createAdminPoll(
  ownerUsername: string,
  input: { title: string; description: string | null; options: string[] },
  flags: AdminCatalogFlags = defaultCatalogFlags(),
): Promise<AdminContentMutationResult> {
  const owner = await resolveAdminOwner(ownerUsername);
  if (!owner) return { ok: false, reason: "invalid_owner" };

  const now = new Date();
  const poll = await db.poll.create({
    data: {
      ownerId: owner.id,
      title: input.title,
      description: input.description,
      options: input.options,
      createdAt: now,
      updatedAt: now,
      searchable: flags.searchable,
      catalogVisible: flags.catalogVisible,
      closed: false,
      totalVotes: 0,
      views: 0,
    },
    select: { id: true },
  });
  return { ok: true, id: poll.id };
}

export async function updateAdminPoll(
  pollId: string,
  input: {
    title: string;
    description: string | null;
    options: string[] | null;
    closed: boolean;
  },
  flags: AdminCatalogFlags,
): Promise<AdminContentMutationResult> {
  const poll = await db.poll.findUnique({
    where: { id: pollId },
    select: { id: true, totalVotes: true },
  });
  if (!poll) return { ok: false, reason: "not_found" };
  if (input.options && poll.totalVotes > 0) return { ok: false, reason: "has_votes" };

  await db.poll.update({
    where: { id: poll.id },
    data: {
      title: input.title,
      description: input.description,
      closed: input.closed,
      catalogVisible: flags.catalogVisible,
      searchable: flags.searchable,
      updatedAt: new Date(),
      ...(input.options ? { options: input.options } : {}),
    },
  });
  return { ok: true };
}

export async function deleteAdminPoll(pollId: string): Promise<AdminContentMutationResult> {
  const poll = await db.poll.findUnique({ where: { id: pollId }, select: { id: true } });
  if (!poll) return { ok: false, reason: "not_found" };
  await db.poll.delete({ where: { id: poll.id } });
  return { ok: true };
}

// ─── Albums ───────────────────────────────────────────────────────────────────

export interface AdminAlbumDetail {
  id: string;
  title: string;
  description: string | null;
  catalogVisible: boolean;
  searchable: boolean;
  totalFiles: number;
  views: number;
  createdAt: Date;
  updatedAt: Date;
  owner: { username: string; displayName: string };
}

export async function getAdminAlbumDetail(albumId: string): Promise<AdminAlbumDetail | null> {
  return db.album.findUnique({
    where: { id: albumId },
    select: {
      id: true,
      title: true,
      description: true,
      catalogVisible: true,
      searchable: true,
      totalFiles: true,
      views: true,
      createdAt: true,
      updatedAt: true,
      owner: { select: ownerSelect },
    },
  });
}

export async function createAdminAlbum(
  ownerUsername: string,
  input: { title: string; description: string | null },
  flags: AdminCatalogFlags = defaultCatalogFlags(),
): Promise<AdminContentMutationResult> {
  const owner = await resolveAdminOwner(ownerUsername);
  if (!owner) return { ok: false, reason: "invalid_owner" };

  const now = new Date();
  const album = await db.album.create({
    data: {
      ownerId: owner.id,
      title: input.title,
      description: input.description,
      createdAt: now,
      updatedAt: now,
      searchable: flags.searchable,
      catalogVisible: flags.catalogVisible,
      totalFiles: 0,
      views: 0,
    },
    select: { id: true },
  });
  return { ok: true, id: album.id };
}

export async function updateAdminAlbum(
  albumId: string,
  input: { title: string; description: string | null },
  flags: AdminCatalogFlags,
): Promise<AdminContentMutationResult> {
  const album = await db.album.findUnique({ where: { id: albumId }, select: { id: true } });
  if (!album) return { ok: false, reason: "not_found" };
  await db.album.update({
    where: { id: album.id },
    data: {
      title: input.title,
      description: input.description,
      catalogVisible: flags.catalogVisible,
      searchable: flags.searchable,
      updatedAt: new Date(),
    },
  });
  return { ok: true };
}

export async function deleteAdminAlbum(albumId: string): Promise<AdminContentMutationResult> {
  const album = await db.album.findUnique({ where: { id: albumId }, select: { id: true } });
  if (!album) return { ok: false, reason: "not_found" };
  await db.album.delete({ where: { id: album.id } });
  return { ok: true };
}

// ─── Classifieds ──────────────────────────────────────────────────────────────

export interface AdminClassifiedDetail {
  id: string;
  title: string;
  body: string | null;
  categoryId: string | null;
  catalogVisible: boolean;
  searchable: boolean;
  views: number;
  createdAt: Date;
  updatedAt: Date;
  owner: { username: string; displayName: string };
  category: { id: string; title: string } | null;
}

export async function getAdminClassifiedDetail(classifiedId: string): Promise<AdminClassifiedDetail | null> {
  return db.classified.findUnique({
    where: { id: classifiedId },
    select: {
      id: true,
      title: true,
      body: true,
      categoryId: true,
      catalogVisible: true,
      searchable: true,
      views: true,
      createdAt: true,
      updatedAt: true,
      owner: { select: ownerSelect },
      category: { select: { id: true, title: true } },
    },
  });
}

export async function createAdminClassified(
  ownerUsername: string,
  input: { title: string; body: string | null; categoryId: string | null },
  flags: AdminCatalogFlags = defaultCatalogFlags(),
): Promise<AdminContentMutationResult> {
  const owner = await resolveAdminOwner(ownerUsername);
  if (!owner) return { ok: false, reason: "invalid_owner" };
  if (!(await validateActiveCategory(input.categoryId, findClassifiedCategory))) {
    return { ok: false, reason: "invalid_category" };
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
      searchable: flags.searchable,
      catalogVisible: flags.catalogVisible,
      privacy: 63,
      views: 0,
      totalComments: 0,
    },
    select: { id: true },
  });
  return { ok: true, id: classified.id };
}

export async function updateAdminClassified(
  classifiedId: string,
  input: { title: string; body: string | null; categoryId: string | null },
  flags: AdminCatalogFlags,
): Promise<AdminContentMutationResult> {
  const classified = await db.classified.findUnique({ where: { id: classifiedId }, select: { id: true } });
  if (!classified) return { ok: false, reason: "not_found" };
  if (!(await validateActiveCategory(input.categoryId, findClassifiedCategory))) {
    return { ok: false, reason: "invalid_category" };
  }
  await db.classified.update({
    where: { id: classified.id },
    data: {
      title: input.title,
      body: input.body,
      categoryId: input.categoryId,
      catalogVisible: flags.catalogVisible,
      searchable: flags.searchable,
      updatedAt: new Date(),
    },
  });
  return { ok: true };
}

export async function deleteAdminClassified(classifiedId: string): Promise<AdminContentMutationResult> {
  const classified = await db.classified.findUnique({ where: { id: classifiedId }, select: { id: true } });
  if (!classified) return { ok: false, reason: "not_found" };
  await db.classified.delete({ where: { id: classified.id } });
  return { ok: true };
}

// ─── Blogs ────────────────────────────────────────────────────────────────────

export interface AdminBlogDetail {
  id: string;
  title: string;
  body: string | null;
  categoryId: string | null;
  catalogVisible: boolean;
  searchable: boolean;
  views: number;
  createdAt: Date;
  updatedAt: Date;
  author: { username: string; displayName: string };
  category: { id: string; title: string } | null;
}

export async function getAdminBlogDetail(entryId: string): Promise<AdminBlogDetail | null> {
  return db.blogEntry.findUnique({
    where: { id: entryId },
    select: {
      id: true,
      title: true,
      body: true,
      categoryId: true,
      catalogVisible: true,
      searchable: true,
      views: true,
      createdAt: true,
      updatedAt: true,
      author: { select: ownerSelect },
      category: { select: { id: true, title: true } },
    },
  });
}

export async function createAdminBlog(
  ownerUsername: string,
  input: { title: string; body: string | null; categoryId: string | null },
  flags: AdminCatalogFlags = defaultCatalogFlags(),
): Promise<AdminContentMutationResult> {
  const owner = await resolveAdminOwner(ownerUsername);
  if (!owner) return { ok: false, reason: "invalid_owner" };
  if (!(await validateActiveCategory(input.categoryId, findBlogCategory))) {
    return { ok: false, reason: "invalid_category" };
  }

  const now = new Date();
  const entry = await db.blogEntry.create({
    data: {
      authorId: owner.id,
      title: input.title,
      body: input.body,
      categoryId: input.categoryId,
      createdAt: now,
      updatedAt: now,
      searchable: flags.searchable,
      catalogVisible: flags.catalogVisible,
      views: 0,
    },
    select: { id: true },
  });
  return { ok: true, id: entry.id };
}

export async function updateAdminBlog(
  entryId: string,
  input: { title: string; body: string | null; categoryId: string | null },
  flags: AdminCatalogFlags,
): Promise<AdminContentMutationResult> {
  const entry = await db.blogEntry.findUnique({ where: { id: entryId }, select: { id: true } });
  if (!entry) return { ok: false, reason: "not_found" };
  if (!(await validateActiveCategory(input.categoryId, findBlogCategory))) {
    return { ok: false, reason: "invalid_category" };
  }
  await db.blogEntry.update({
    where: { id: entry.id },
    data: {
      title: input.title,
      body: input.body,
      categoryId: input.categoryId,
      catalogVisible: flags.catalogVisible,
      searchable: flags.searchable,
      updatedAt: new Date(),
    },
  });
  return { ok: true };
}

export async function deleteAdminBlog(entryId: string): Promise<AdminContentMutationResult> {
  const entry = await db.blogEntry.findUnique({ where: { id: entryId }, select: { id: true } });
  if (!entry) return { ok: false, reason: "not_found" };
  await db.blogEntry.delete({ where: { id: entry.id } });
  return { ok: true };
}

// ─── Businesses ───────────────────────────────────────────────────────────────

export interface AdminBusinessDetail {
  id: string;
  title: string;
  summary: string | null;
  description: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  categoryId: string | null;
  catalogVisible: boolean;
  searchable: boolean;
  views: number;
  createdAt: Date;
  updatedAt: Date;
  owner: { username: string; displayName: string };
  category: { id: string; title: string } | null;
}

export async function getAdminBusinessDetail(businessId: string): Promise<AdminBusinessDetail | null> {
  return db.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      title: true,
      summary: true,
      description: true,
      city: true,
      province: true,
      country: true,
      categoryId: true,
      catalogVisible: true,
      searchable: true,
      views: true,
      createdAt: true,
      updatedAt: true,
      owner: { select: ownerSelect },
      category: { select: { id: true, title: true } },
    },
  });
}

export async function createAdminBusiness(
  ownerUsername: string,
  input: {
    title: string;
    summary: string | null;
    description: string | null;
    city: string | null;
    province: string | null;
    country: string | null;
    categoryId: string | null;
  },
  flags: AdminCatalogFlags = defaultCatalogFlags(),
): Promise<AdminContentMutationResult> {
  const owner = await resolveAdminOwner(ownerUsername);
  if (!owner) return { ok: false, reason: "invalid_owner" };
  if (!(await validateActiveCategory(input.categoryId, findBusinessCategory))) {
    return { ok: false, reason: "invalid_category" };
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
      searchable: flags.searchable,
      catalogVisible: flags.catalogVisible,
      views: 0,
      totalComments: 0,
    },
    select: { id: true },
  });
  return { ok: true, id: business.id };
}

export async function updateAdminBusiness(
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
  flags: AdminCatalogFlags,
): Promise<AdminContentMutationResult> {
  const business = await db.business.findUnique({ where: { id: businessId }, select: { id: true } });
  if (!business) return { ok: false, reason: "not_found" };
  if (!(await validateActiveCategory(input.categoryId, findBusinessCategory))) {
    return { ok: false, reason: "invalid_category" };
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
      catalogVisible: flags.catalogVisible,
      searchable: flags.searchable,
      updatedAt: new Date(),
    },
  });
  return { ok: true };
}

export async function deleteAdminBusiness(businessId: string): Promise<AdminContentMutationResult> {
  const business = await db.business.findUnique({ where: { id: businessId }, select: { id: true } });
  if (!business) return { ok: false, reason: "not_found" };
  await db.business.delete({ where: { id: business.id } });
  return { ok: true };
}

// ─── Articles ─────────────────────────────────────────────────────────────────

export interface AdminArticleDetail {
  id: string;
  title: string;
  body: string | null;
  categoryId: string | null;
  catalogVisible: boolean;
  searchable: boolean;
  draft: boolean;
  approved: boolean;
  views: number;
  publishedAt: Date;
  updatedAt: Date;
  author: { username: string; displayName: string };
  category: { id: string; title: string } | null;
}

export async function getAdminArticleDetail(articleId: string): Promise<AdminArticleDetail | null> {
  return db.article.findUnique({
    where: { id: articleId },
    select: {
      id: true,
      title: true,
      body: true,
      categoryId: true,
      catalogVisible: true,
      searchable: true,
      draft: true,
      approved: true,
      views: true,
      publishedAt: true,
      updatedAt: true,
      author: { select: ownerSelect },
      category: { select: { id: true, title: true } },
    },
  });
}

export async function createAdminArticle(
  ownerUsername: string,
  input: { title: string; body: string | null; categoryId: string | null; draft?: boolean; approved?: boolean },
  flags: AdminCatalogFlags = defaultCatalogFlags(),
): Promise<AdminContentMutationResult> {
  const owner = await resolveAdminOwner(ownerUsername);
  if (!owner) return { ok: false, reason: "invalid_owner" };
  if (!(await validateActiveCategory(input.categoryId, findArticleCategory))) {
    return { ok: false, reason: "invalid_category" };
  }

  const now = new Date();
  const article = await db.article.create({
    data: {
      authorId: owner.id,
      title: input.title,
      body: input.body,
      categoryId: input.categoryId,
      publishedAt: now,
      updatedAt: now,
      searchable: flags.searchable,
      catalogVisible: flags.catalogVisible,
      draft: input.draft ?? false,
      approved: input.approved ?? true,
      views: 0,
    },
    select: { id: true },
  });
  return { ok: true, id: article.id };
}

export async function updateAdminArticle(
  articleId: string,
  input: {
    title: string;
    body: string | null;
    categoryId: string | null;
    draft: boolean;
    approved: boolean;
  },
  flags: AdminCatalogFlags,
): Promise<AdminContentMutationResult> {
  const article = await db.article.findUnique({ where: { id: articleId }, select: { id: true } });
  if (!article) return { ok: false, reason: "not_found" };
  if (!(await validateActiveCategory(input.categoryId, findArticleCategory))) {
    return { ok: false, reason: "invalid_category" };
  }
  await db.article.update({
    where: { id: article.id },
    data: {
      title: input.title,
      body: input.body,
      categoryId: input.categoryId,
      draft: input.draft,
      approved: input.approved,
      catalogVisible: flags.catalogVisible,
      searchable: flags.searchable,
      updatedAt: new Date(),
    },
  });
  return { ok: true };
}

export async function deleteAdminArticle(articleId: string): Promise<AdminContentMutationResult> {
  const article = await db.article.findUnique({ where: { id: articleId }, select: { id: true } });
  if (!article) return { ok: false, reason: "not_found" };
  await db.article.delete({ where: { id: article.id } });
  return { ok: true };
}
