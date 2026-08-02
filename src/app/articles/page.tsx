import type { Metadata } from "next";
import Link from "next/link";

import { normalizeArticleQuery, type ArticleSort } from "@domain/articles";
import { getCurrentUser } from "@/server/auth/session";
import { getArticleCatalog } from "@/server/articles/service";
import { ClientShell } from "@/components/client/ClientShell";

export const metadata: Metadata = {
  title: "Artículos | Red Social",
  description: "Descubre artículos visibles y aprobados de la comunidad.",
};

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = normalizeArticleQuery({
    page: readNumber(params.page),
    search: readString(params.search),
    categoryId: readString(params.categoryId),
    featured: readString(params.featured) === "1",
    sort: readSort(params.sort),
  });
  const viewer = await getCurrentUser();
  const catalog = await getArticleCatalog(viewer?.id ?? null, query);

  return (
    <ClientShell current="explore">
      <section className="profile-panel article-panel" aria-labelledby="articles-title">
        <p className="eyebrow">Publicación · Artículos</p>
        <h1 id="articles-title">Conocimiento compartido</h1>
        <p className="lead">Explora artículos aprobados, buscables y visibles según la privacidad de cada autor.</p>

        <form className="article-filters" method="get">
          <div className="article-filter-search">
            <label htmlFor="article-search">Buscar</label>
            <input id="article-search" name="search" defaultValue={query.search} maxLength={100} placeholder="Título o contenido" />
          </div>
          <div>
            <label htmlFor="article-sort">Ordenar</label>
            <select id="article-sort" name="sort" defaultValue={query.sort}>
              <option value="created">Más recientes</option>
              <option value="views">Más vistos</option>
              <option value="title">Por título</option>
            </select>
          </div>
          <label className="article-featured-filter">
            <input type="checkbox" name="featured" value="1" defaultChecked={query.featured} /> Solo destacados
          </label>
          {query.categoryId ? <input type="hidden" name="categoryId" value={query.categoryId} /> : null}
          <button className="button button-primary button-small" type="submit">Filtrar</button>
        </form>

        <div className="article-category-bar" aria-label="Filtrar por categoría">
          <Link className={!query.categoryId ? "category-chip category-chip-active" : "category-chip"} href={categoryHref(query.search, query.sort, query.featured, null)}>Todos</Link>
          {catalog.categories.filter((category) => category.parentId === null).map((category) => (
            <Link className={query.categoryId === category.id ? "category-chip category-chip-active" : "category-chip"} href={categoryHref(query.search, query.sort, query.featured, category.id)} key={category.id}>
              {category.title}
            </Link>
          ))}
        </div>

        {catalog.items.length > 0 ? (
          <div className="article-list">
            {catalog.items.map((article) => (
              <article className="article-card" key={article.id}>
                <div className="article-card-heading">
                  <p className="eyebrow">{article.category?.title ?? "Artículo"}</p>
                  {article.featured ? <span className="article-badge">Destacado</span> : null}
                </div>
                <h2><Link href={`/articles/${encodeURIComponent(article.id)}`}>{article.title}</Link></h2>
                {article.excerpt ? <p className="article-summary">{article.excerpt}</p> : null}
                <dl className="article-facts">
                  <div><dt>Autor</dt><dd><Link href={`/profile/${encodeURIComponent(article.author.username)}`}>{article.author.displayName}</Link></dd></div>
                  <div><dt>Publicado</dt><dd><time dateTime={article.publishedAt.toISOString()}>{formatDate(article.publishedAt)}</time></dd></div>
                  <div><dt>Actividad</dt><dd>{article.views} visitas</dd></div>
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">No encontramos artículos visibles con estos filtros.</p>
        )}

        <ArticlePagination page={catalog.pagination.page} pageCount={catalog.pagination.pageCount} search={query.search} sort={query.sort} featured={query.featured} categoryId={query.categoryId} />
      </section>
    </ClientShell>
  );
}

function ArticlePagination({ page, pageCount, search, sort, featured, categoryId }: { page: number; pageCount: number; search: string; sort: ArticleSort; featured: boolean; categoryId: string | null }) {
  if (pageCount <= 1) return null;
  const href = (nextPage: number): string => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (sort !== "created") params.set("sort", sort);
    if (featured) params.set("featured", "1");
    if (categoryId) params.set("categoryId", categoryId);
    if (nextPage > 1) params.set("page", String(nextPage));
    return `/articles?${params.toString()}#articles-title`;
  };
  return <nav className="article-pagination" aria-label="Paginación de artículos">
    {page > 1 ? <Link className="text-link" href={href(page - 1)}>Anteriores</Link> : <span aria-disabled="true">Anteriores</span>}
    <span aria-current="page">Página {page} de {pageCount}</span>
    {page < pageCount ? <Link className="text-link" href={href(page + 1)}>Siguientes</Link> : <span aria-disabled="true">Siguientes</span>}
  </nav>;
}

function categoryHref(search: string, sort: ArticleSort, featured: boolean, categoryId: string | null): string {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (sort !== "created") params.set("sort", sort);
  if (featured) params.set("featured", "1");
  if (categoryId) params.set("categoryId", categoryId);
  const query = params.toString();
  return `/articles${query ? `?${query}` : ""}#articles-title`;
}

function formatDate(value: Date): string { return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(value); }
function readString(value: string | string[] | undefined): string | undefined { return Array.isArray(value) ? value[0] : value; }
function readNumber(value: string | string[] | undefined): number | undefined { const raw = readString(value); const number = Number(raw); return Number.isInteger(number) ? number : undefined; }
function readSort(value: string | string[] | undefined): ArticleSort | undefined { const raw = readString(value); return raw === "created" || raw === "views" || raw === "title" ? raw : undefined; }
