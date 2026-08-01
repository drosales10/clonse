export const FORUM_PAGE_SIZE = 10;
export const FORUM_MAX_PAGE = 10_000;

export interface ForumQuery {
  instanceId: string | null;
  categoryId: string | null;
  topicId: string | null;
  page: number;
}

export interface PublicForumAuthor {
  username: string;
  displayName: string;
}

export interface PublicForumInstance {
  id: string;
  legacyId: number | null;
  name: string | null;
  description: string | null;
  position: number;
}

export interface PublicForumCategory {
  id: string;
  legacyId: number | null;
  parentId: string | null;
  title: string;
  description: string | null;
  position: number;
  isLocked: boolean;
}

export interface PublicForumTopic {
  id: string;
  legacyId: number | null;
  categoryId: string;
  title: string;
  bodyExcerpt: string | null;
  author: PublicForumAuthor;
  createdAt: Date;
  lastPostAt: Date;
  replyCount: number;
  views: number;
  rating: number | null;
  isLocked: boolean;
  isAnnouncement: boolean;
  isSticky: boolean;
  hasAttachments: boolean;
}

export interface PublicForumPost {
  id: string;
  legacyId: number | null;
  topicId: string;
  body: string | null;
  author: PublicForumAuthor;
  createdAt: Date;
  modifiedAt: Date | null;
  hasAttachments: boolean;
}

export interface ForumPagination {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  start: number;
  end: number;
}

export function normalizeForumQuery(input: Partial<ForumQuery>): ForumQuery {
  const rawPage = Number.isInteger(input.page) ? Number(input.page) : 1;
  return {
    instanceId: nonEmpty(input.instanceId),
    categoryId: nonEmpty(input.categoryId),
    topicId: nonEmpty(input.topicId),
    page: Math.min(Math.max(rawPage, 1), FORUM_MAX_PAGE),
  };
}

function nonEmpty(value: string | null | undefined): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function makePagination(total: number, requestedPage: number): ForumPagination {
  const pageCount = Math.max(1, Math.ceil(total / FORUM_PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const startIndex = (page - 1) * FORUM_PAGE_SIZE;
  return {
    page,
    pageSize: FORUM_PAGE_SIZE,
    total,
    pageCount,
    start: total === 0 ? 0 : startIndex + 1,
    end: Math.min(startIndex + FORUM_PAGE_SIZE, total),
  };
}
