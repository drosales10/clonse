import type { Metadata } from "next";
import Link from "next/link";

import { normalizeForumQuery } from "@domain/forum";
import { getForumCatalog } from "@/server/forum/service";

export const metadata: Metadata = { title: "Categoría del foro | Red Social" };

export default async function ForumCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ instanceId: string; categoryId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { instanceId, categoryId } = await params;
  const query = await searchParams;
  const page = Number(readString(query.page));
  const catalog = await getForumCatalog(normalizeForumQuery({
    instanceId,
    categoryId,
    page: Number.isInteger(page) ? page : 1,
  }));
  const category = catalog.categories.find((item) => item.id === categoryId);
  const parent = category?.parentId ? catalog.categories.find((item) => item.id === category.parentId) : null;

  if (!catalog.instance || !category || !parent || category.parentId === null) {
    return <main className="public-shell"><section className="auth-card"><p className="eyebrow">Foros</p><h1>Categoría no disponible</h1><p className="lead">No encontramos esta categoría o no está publicada para visitantes.</p><Link className="button button-primary" href={`/forum/${instanceId}`}>Volver al foro</Link></section></main>;
  }

  return <main className="authenticated-shell">
    <header className="app-header"><Link className="brand" href="/">nexo<span>.</span></Link><nav className="profile-navigation" aria-label="Navegación principal"><Link className="text-link" href={`/forum/${instanceId}`}>Foro</Link><Link className="text-link" href="/forum">Foros</Link></nav></header>
    <section className="profile-panel forum-panel" aria-labelledby="category-title">
      <Link className="text-link forum-back-link" href={`/forum/${instanceId}`}>← Volver a categorías</Link>
      <p className="eyebrow">{parent.title} · Categoría</p>
      <h1 id="category-title">{category.title}</h1>
      {category.description ? <p className="lead">{toExcerpt(category.description)}</p> : null}
      {catalog.topics.length > 0 ? <div className="forum-topic-list">{catalog.topics.map((topic) => <article className="forum-topic-card" key={topic.id}><div className="forum-topic-heading"><div><p className="eyebrow">{topic.isAnnouncement ? "Anuncio" : topic.isSticky ? "Fijado" : "Tema"}</p><h2><Link href={`/forum/${instanceId}/topics/${topic.id}?categoryId=${category.id}`}>{topic.title}</Link></h2></div>{topic.isLocked ? <span className="forum-badge">Bloqueado</span> : null}</div>{topic.bodyExcerpt ? <p>{topic.bodyExcerpt}</p> : null}<dl className="forum-facts"><div><dt>Autor</dt><dd>{topic.author.displayName}</dd></div><div><dt>Actividad</dt><dd><time dateTime={topic.lastPostAt.toISOString()}>{formatDate(topic.lastPostAt)}</time></dd></div><div><dt>Respuestas</dt><dd>{topic.replyCount}</dd></div><div><dt>Visitas</dt><dd>{topic.views}</dd></div></dl></article>)}</div> : <p className="empty-state">No hay temas públicos en esta categoría.</p>}
      <ForumPagination page={catalog.pagination.page} pageCount={catalog.pagination.pageCount} instanceId={instanceId} categoryId={category.id} />
    </section>
  </main>;
}

function ForumPagination({ page, pageCount, instanceId, categoryId }: { page: number; pageCount: number; instanceId: string; categoryId: string }) {
  if (pageCount <= 1) return null;
  const href = (next: number) => `/forum/${instanceId}/categories/${categoryId}?${new URLSearchParams(next > 1 ? { page: String(next) } : {}).toString()}#category-title`;
  return <nav className="forum-pagination" aria-label="Paginación de temas"><>{page > 1 ? <Link className="text-link" href={href(page - 1)}>Anteriores</Link> : <span>Anterior</span>}</><span>Página {page} de {pageCount}</span>{page < pageCount ? <Link className="text-link" href={href(page + 1)}>Siguientes</Link> : <span>Siguiente</span>}</nav>;
}

function readString(value: string | string[] | undefined): string | undefined { return Array.isArray(value) ? value[0] : value; }
function toExcerpt(value: string): string { const text = value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(); return text.length > 180 ? `${text.slice(0, 177)}...` : text; }
function formatDate(value: Date): string { return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(value); }
