import Link from "next/link";

import type { PublicForumCategory, PublicForumInstance, PublicForumPost, PublicForumTopic } from "@domain/forum";

import { ForumBreadcrumb } from "@/app/components/forum/forum-ui";
import { formatForumDateTime, ownerInitials, topicKindLabel, toExcerpt } from "@/app/components/forum/utils";

function toSafeText(value: string | null): string {
  if (!value) return "";
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function ForumTopicHeader({
  instance,
  category,
  topic,
  parentTitle,
}: {
  instance: PublicForumInstance;
  category: PublicForumCategory;
  topic: PublicForumTopic;
  parentTitle?: string | null;
}) {
  const categoryLabel = parentTitle ? `${parentTitle} · ${category.title}` : category.title;
  return (
    <header className="forum-detail-header">
      <ForumBreadcrumb
        items={[
          { label: "Inicio", href: "/home" },
          { label: "Foros", href: "/forum" },
          { label: instance.name ?? "Foro", href: `/forum/${encodeURIComponent(instance.id)}` },
          { label: category.title, href: `/forum/${encodeURIComponent(instance.id)}/categories/${encodeURIComponent(category.id)}` },
          { label: topic.title },
        ]}
      />
      <div className="forum-detail-heading">
        <div>
          <div className="forum-detail-badges">
            <span className="forum-topic-kind">{topicKindLabel(topic)}</span>
            {topic.isLocked ? <span className="forum-badge forum-badge-locked">Bloqueado</span> : null}
          </div>
          <h1 id="forum-topic">{topic.title}</h1>
          <p className="forum-detail-category">{categoryLabel}</p>
        </div>
        <div className="forum-detail-actions">
          <Link className="forum-btn forum-btn-secondary" href={`/forum/${encodeURIComponent(instance.id)}/categories/${encodeURIComponent(category.id)}`}>
            Volver a {category.title}
          </Link>
        </div>
      </div>
      <dl className="forum-detail-facts">
        <div>
          <dt>Autor</dt>
          <dd>{topic.author.displayName}</dd>
        </div>
        <div>
          <dt>Publicado</dt>
          <dd>
            <time dateTime={topic.createdAt.toISOString()}>{formatForumDateTime(topic.createdAt)}</time>
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
    </header>
  );
}

export function ForumPostList({ posts }: { posts: PublicForumPost[] }) {
  return (
    <section aria-labelledby="forum-posts-title" className="forum-posts-section">
      <h2 id="forum-posts-title">Mensajes</h2>
      <div className="forum-post-list">
        {posts.map((post, index) => (
          <article className="forum-post-card" key={post.id}>
            <header className="forum-post-header">
              <div className="forum-post-author">
                <span aria-hidden="true" className="forum-avatar">
                  {ownerInitials(post.author.displayName)}
                </span>
                <div>
                  <strong>{post.author.displayName}</strong>
                  <span>@{post.author.username}</span>
                </div>
              </div>
              <time dateTime={post.createdAt.toISOString()}>{formatForumDateTime(post.createdAt)}</time>
            </header>
            <div className="forum-post-body">
              <p>{toSafeText(post.body) || "Sin contenido"}</p>
            </div>
            {index === 0 ? <span className="forum-post-origin">Mensaje inicial</span> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export function ForumCategoryHeader({
  instanceId,
  instanceName,
  parentTitle,
  category,
  canCreate,
}: {
  instanceId: string;
  instanceName: string | null;
  parentTitle: string;
  category: PublicForumCategory;
  canCreate: boolean;
}) {
  return (
    <header className="forum-page-header">
      <ForumBreadcrumb
        items={[
          { label: "Inicio", href: "/home" },
          { label: "Foros", href: "/forum" },
          { label: instanceName ?? "Foro", href: `/forum/${encodeURIComponent(instanceId)}` },
          { label: category.title },
        ]}
      />
      <div className="forum-page-heading">
        <div>
          <p className="forum-page-eyebrow">
            {parentTitle} · Categoría
          </p>
          <h1 id="category-title">{category.title}</h1>
          {category.description ? <p className="forum-page-lead">{toExcerpt(category.description, 280)}</p> : null}
          {category.isLocked ? (
            <p className="forum-inline-notice" role="status">
              Esta categoría está bloqueada. No se aceptan nuevos temas ni respuestas.
            </p>
          ) : null}
        </div>
        {canCreate ? (
          <Link
            className="forum-btn forum-btn-primary"
            href={`/forum/${encodeURIComponent(instanceId)}/categories/${encodeURIComponent(category.id)}/new`}
          >
            Nuevo tema
          </Link>
        ) : null}
      </div>
    </header>
  );
}

export function ForumInstanceHeader({
  instance,
}: {
  instance: { id: string; name: string | null; description: string | null };
}) {
  return (
    <header className="forum-page-header">
      <ForumBreadcrumb
        items={[
          { label: "Inicio", href: "/home" },
          { label: "Foros", href: "/forum" },
          { label: instance.name ?? "Foro comunitario" },
        ]}
      />
      <div className="forum-page-heading">
        <div>
          <p className="forum-page-eyebrow">Foro público</p>
          <h1>{instance.name ?? "Foro comunitario"}</h1>
          {instance.description ? <p className="forum-page-lead">{toExcerpt(instance.description, 280)}</p> : null}
        </div>
      </div>
    </header>
  );
}
