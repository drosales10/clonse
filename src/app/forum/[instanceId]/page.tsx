import type { Metadata } from "next";
import Link from "next/link";

import { normalizeForumQuery } from "@domain/forum";
import { getForumCatalog } from "@/server/forum/service";

export const metadata: Metadata = { title: "Categorías del foro | Red Social" };

export default async function ForumInstancePage({ params, searchParams }: { params: Promise<{ instanceId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { instanceId } = await params;
  const queryParams = await searchParams;
  const categoryId = readString(queryParams.categoryId);
  const page = Number(readString(queryParams.page));
  const catalog = await getForumCatalog(normalizeForumQuery({ instanceId, categoryId, page: Number.isInteger(page) ? page : 1 }));
  if (!catalog.instance) return <main className="public-shell"><section className="auth-card"><p className="eyebrow">Foros</p><h1>Foro no disponible</h1><p className="lead">No encontramos esta instancia o no está publicada.</p><Link className="button button-primary" href="/forum">Volver a foros</Link></section></main>;
  const rootCategories = catalog.categories.filter((category) => category.parentId === null);
  return <main className="authenticated-shell">
    <header className="app-header"><Link className="brand" href="/">nexo<span>.</span></Link><nav className="profile-navigation" aria-label="Navegación principal"><Link className="text-link" href="/forum">Foros</Link><Link className="text-link" href="/articles">Artículos</Link></nav></header>
    <section className="profile-panel forum-panel" aria-labelledby="forum-title">
      <p className="eyebrow">Foro público</p><h1 id="forum-title">{catalog.instance.name ?? "Foro comunitario"}</h1>{catalog.instance.description ? <p className="lead">{toExcerpt(catalog.instance.description)}</p> : null}
      <div className="forum-category-bar"><Link className={!categoryId ? "category-chip category-chip-active" : "category-chip"} href={`/forum/${catalog.instance.id}`}>Todos</Link>{rootCategories.map((category) => <Link className={categoryId === category.id ? "category-chip category-chip-active" : "category-chip"} href={`/forum/${catalog.instance?.id}?categoryId=${category.id}`} key={category.id}>{category.title}</Link>)}</div>
      {catalog.topics.length > 0 ? <div className="forum-topic-list">{catalog.topics.map((topic) => <article className="forum-topic-card" key={topic.id}><div className="forum-topic-heading"><div><p className="eyebrow">{topic.isAnnouncement ? "Anuncio" : topic.isSticky ? "Fijado" : "Tema"}</p><h2><Link href={`/forum/${catalog.instance?.id}/topics/${topic.id}?categoryId=${topic.categoryId}`}>{topic.title}</Link></h2></div>{topic.isLocked ? <span className="forum-badge">Bloqueado</span> : null}</div>{topic.bodyExcerpt ? <p>{topic.bodyExcerpt}</p> : null}<dl className="forum-facts"><div><dt>Autor</dt><dd>{topic.author.displayName}</dd></div><div><dt>Actividad</dt><dd><time dateTime={topic.lastPostAt.toISOString()}>{formatDate(topic.lastPostAt)}</time></dd></div><div><dt>Respuestas</dt><dd>{topic.replyCount}</dd></div><div><dt>Visitas</dt><dd>{topic.views}</dd></div></dl></article>)}</div> : <p className="empty-state">No hay temas públicos en esta instancia.</p>}
      <ForumPagination page={catalog.pagination.page} pageCount={catalog.pagination.pageCount} instanceId={catalog.instance.id} categoryId={categoryId ?? null} />
    </section>
  </main>;
}

function ForumPagination({ page, pageCount, instanceId, categoryId }: { page: number; pageCount: number; instanceId: string; categoryId: string | null }) { if (pageCount <= 1) return null; const href = (next: number) => `/forum/${instanceId}?${new URLSearchParams({ ...(categoryId ? { categoryId } : {}), ...(next > 1 ? { page: String(next) } : {}) }).toString()}#forum-title`; return <nav className="forum-pagination" aria-label="Paginación de temas">{page > 1 ? <Link className="text-link" href={href(page - 1)}>Anteriores</Link> : <span>Anterior</span>}<span>Página {page} de {pageCount}</span>{page < pageCount ? <Link className="text-link" href={href(page + 1)}>Siguientes</Link> : <span>Siguiente</span>}</nav>; }
function readString(value: string | string[] | undefined): string | undefined { return Array.isArray(value) ? value[0] : value; }
function toExcerpt(value: string): string { const text = value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(); return text.length > 180 ? `${text.slice(0, 177)}...` : text; }
function formatDate(value: Date): string { return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(value); }
