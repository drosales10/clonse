import type { Metadata } from "next";
import Link from "next/link";

import { normalizeForumQuery } from "@domain/forum";
import { ForumReplyForm } from "@/app/components/forum-reply-form";
import { getForumTopic } from "@/server/forum/service";
import { getCurrentUser } from "@/server/auth/session";
import { ClientShell } from "@/components/client/ClientShell";

export const metadata: Metadata = { title: "Tema del foro | Red Social" };

export default async function ForumTopicPage({ params, searchParams }: { params: Promise<{ instanceId: string; topicId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { instanceId, topicId } = await params;
  const query = await searchParams;
  const categoryId = readString(query.categoryId);
  const page = Number(readString(query.page));
  const viewer = await getCurrentUser();
  const result = categoryId ? await getForumTopic(normalizeForumQuery({ instanceId, categoryId, topicId, page: Number.isInteger(page) ? page : 1 })) : null;
  if (!result) {
    return (
      <main className="public-shell">
        <section className="auth-card">
          <p className="eyebrow">Foros</p>
          <h1>Tema no disponible</h1>
          <p className="lead">No encontramos este tema o no está publicado para visitantes.</p>
          <Link className="button button-primary" href={`/forum/${instanceId}`}>Volver al foro</Link>
        </section>
      </main>
    );
  }
  return (
    <ClientShell current="explore">
      <section className="profile-panel forum-panel" aria-labelledby="topic-title">
        <p className="eyebrow">{result.category.title}</p>
        <h1 id="topic-title">{result.topic.title}</h1>
        {result.topic.isLocked || result.category.isLocked ? (
          <p className="field-help" role="status">
            {result.topic.isLocked
              ? "Este tema está bloqueado. No se aceptan nuevas respuestas."
              : "Esta categoría está bloqueada. No se aceptan nuevas respuestas."}
          </p>
        ) : null}
        <div className="forum-post-list">
          {result.posts.map((post) => (
            <article className="forum-post-card" key={post.id}>
              <header>
                <strong>{post.author.displayName}</strong>
                <time dateTime={post.createdAt.toISOString()}>{formatDate(post.createdAt)}</time>
              </header>
              <p>{toSafeText(post.body) || "Sin contenido"}</p>
            </article>
          ))}
        </div>
        {viewer && !result.category.isLocked && !result.topic.isLocked ? (
          <ForumReplyForm categoryId={result.category.id} instanceId={result.instance.id} topicId={result.topic.id} />
        ) : null}
        <ForumPagination
          page={result.pagination.page}
          pageCount={result.pagination.pageCount}
          instanceId={instanceId}
          categoryId={result.category.id}
          topicId={topicId}
        />
      </section>
    </ClientShell>
  );
}

function ForumPagination({ page, pageCount, instanceId, categoryId, topicId }: { page: number; pageCount: number; instanceId: string; categoryId: string; topicId: string }) { if (pageCount <= 1) return null; const href = (next: number) => `/forum/${instanceId}/topics/${topicId}?${new URLSearchParams({ categoryId, ...(next > 1 ? { page: String(next) } : {}) }).toString()}#topic-title`; return <nav className="forum-pagination" aria-label="Paginación de respuestas">{page > 1 ? <Link className="text-link" href={href(page - 1)}>Anteriores</Link> : <span>Anterior</span>}<span>Página {page} de {pageCount}</span>{page < pageCount ? <Link className="text-link" href={href(page + 1)}>Siguientes</Link> : <span>Siguiente</span>}</nav>; }
function readString(value: string | string[] | undefined): string | undefined { return Array.isArray(value) ? value[0] : value; }
function toSafeText(value: string | null): string { if (!value) return ""; return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(); }
function formatDate(value: Date): string { return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(value); }
