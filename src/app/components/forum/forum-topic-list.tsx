import Link from "next/link";

import type { PublicForumCategory, PublicForumTopic } from "@domain/forum";

import {
  buildForumCategoryHref,
  buildForumInstanceHref,
  buildForumTopicHref,
  formatForumDate,
  ownerInitials,
  topicKindLabel,
  type CategoryOption,
} from "@/app/components/forum/utils";

export function ForumCategoryBar({
  instanceId,
  categories,
  activeCategoryId,
  page,
}: {
  instanceId: string;
  categories: CategoryOption[];
  activeCategoryId: string | null;
  page?: number;
}) {
  const rootCategories = categories.filter((category) => category.parentId === null);
  return (
    <div aria-label="Filtrar por categoría" className="forum-category-bar">
      <Link
        aria-current={!activeCategoryId ? "page" : undefined}
        className={!activeCategoryId ? "forum-chip forum-chip-active" : "forum-chip"}
        href={buildForumInstanceHref(instanceId, { page: 1 })}
      >
        Todos
      </Link>
      {rootCategories.map((category) => (
        <Link
          aria-current={activeCategoryId === category.id ? "page" : undefined}
          className={activeCategoryId === category.id ? "forum-chip forum-chip-active" : "forum-chip"}
          href={buildForumInstanceHref(instanceId, { categoryId: category.id, page: 1 })}
          key={category.id}
        >
          {category.title}
        </Link>
      ))}
    </div>
  );
}

export function ForumSubcategoryNav({
  instanceId,
  categories,
}: {
  instanceId: string;
  categories: PublicForumCategory[];
}) {
  const rootCategories = categories.filter((category) => category.parentId === null);
  const groups = rootCategories
    .map((root) => ({
      root,
      children: categories.filter((category) => category.parentId === root.id),
    }))
    .filter((group) => group.children.length > 0);

  if (groups.length === 0) return null;

  return (
    <nav aria-label="Subcategorías" className="forum-subcategory-nav">
      {groups.map(({ root, children }) => (
        <div className="forum-subcategory-group" key={root.id}>
          <span>{root.title}</span>
          {children.map((category) => (
            <Link href={buildForumCategoryHref(instanceId, category.id)} key={category.id}>
              {category.title}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}

export function ForumTopicCard({
  topic,
  instanceId,
  categoryId,
}: {
  topic: PublicForumTopic;
  instanceId: string;
  categoryId: string;
}) {
  const href = buildForumTopicHref(instanceId, topic.id, categoryId);
  return (
    <article className="forum-topic-card">
      <div className="forum-topic-heading">
        <div>
          <span className="forum-topic-kind">{topicKindLabel(topic)}</span>
          <h2>
            <Link href={href}>{topic.title}</Link>
          </h2>
        </div>
        <div className="forum-topic-badges">
          {topic.isLocked ? <span className="forum-badge forum-badge-locked">Bloqueado</span> : null}
          {topic.isOwn ? <span className="forum-badge forum-badge-own">Tu tema</span> : null}
        </div>
      </div>
      {topic.bodyExcerpt ? <p className="forum-topic-excerpt">{topic.bodyExcerpt}</p> : null}
      <div className="forum-topic-author">
        <span aria-hidden="true" className="forum-avatar">
          {ownerInitials(topic.author.displayName)}
        </span>
        <span>{topic.author.displayName}</span>
      </div>
      <dl className="forum-topic-meta">
        <div>
          <dt>Actividad</dt>
          <dd>
            <time dateTime={topic.lastPostAt.toISOString()}>{formatForumDate(topic.lastPostAt)}</time>
          </dd>
        </div>
        <div>
          <dt>Respuestas</dt>
          <dd>{topic.replyCount}</dd>
        </div>
        <div>
          <dt>Visitas</dt>
          <dd>{topic.views}</dd>
        </div>
      </dl>
    </article>
  );
}

export function ForumTopicList({
  topics,
  instanceId,
  categoryIdForLink,
}: {
  topics: PublicForumTopic[];
  instanceId: string;
  categoryIdForLink?: string;
}) {
  return (
    <div className="forum-topic-list">
      {topics.map((topic) => (
        <ForumTopicCard
          categoryId={categoryIdForLink ?? topic.categoryId}
          instanceId={instanceId}
          key={topic.id}
          topic={topic}
        />
      ))}
    </div>
  );
}

export function ForumTopicPagination({
  page,
  pageCount,
  hrefForPage,
}: {
  page: number;
  pageCount: number;
  hrefForPage: (page: number) => string;
}) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label="Paginación" className="forum-pagination">
      {page > 1 ? (
        <Link className="forum-btn forum-btn-secondary" href={hrefForPage(page - 1)}>
          Anterior
        </Link>
      ) : (
        <span className="forum-btn forum-btn-secondary is-disabled">Anterior</span>
      )}
      <span aria-current="page">
        Página {page} de {pageCount}
      </span>
      {page < pageCount ? (
        <Link className="forum-btn forum-btn-secondary" href={hrefForPage(page + 1)}>
          Siguiente
        </Link>
      ) : (
        <span className="forum-btn forum-btn-secondary is-disabled">Siguiente</span>
      )}
    </nav>
  );
}
