import type { Metadata } from "next";
import Link from "next/link";

import { normalizeBlogQuery, type BlogSort } from "@domain/blogs";
import { getCurrentUser } from "@/server/auth/session";
import { getBlogCatalog } from "@/server/blogs/service";
import { ClientShell } from "@/components/client/ClientShell";

export const metadata: Metadata = {
  title: "Blogs | Red Social",
  description: "Descubre entradas de blog visibles de la comunidad.",
};

export default async function BlogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = normalizeBlogQuery({
    page: readNumber(params.page),
    search: readString(params.search),
    categoryId: readString(params.categoryId),
    sort: readSort(params.sort),
  });
  const viewer = await getCurrentUser();
  const catalog = await getBlogCatalog(viewer?.id ?? null, query);

  return (
    <ClientShell current="explore">
      <section className="profile-panel blog-panel" aria-labelledby="blogs-title">
        <p className="eyebrow">Publicación · Blogs</p>
        <h1 id="blogs-title">Ideas de la comunidad</h1>
        <p className="lead">Explora entradas buscables y visibles según la privacidad de cada autor.</p>

        <div className="poll-toolbar">
          {viewer ? (
            <Link className="button button-primary button-small" href="/blogs/new">
              Crear entrada
            </Link>
          ) : (
            <Link className="text-link" href="/login?returnUrl=/blogs/new">
              Inicia sesión para crear una entrada
            </Link>
          )}
        </div>

        <form className="blog-filters" method="get">
          <div className="blog-filter-search">
            <label htmlFor="blog-search">Buscar</label>
            <input id="blog-search" name="search" defaultValue={query.search} maxLength={100} placeholder="Título o contenido" />
          </div>
          <div>
            <label htmlFor="blog-sort">Ordenar</label>
            <select id="blog-sort" name="sort" defaultValue={query.sort}>
              <option value="created">Más recientes</option>
              <option value="views">Más vistos</option>
            </select>
          </div>
          {query.categoryId ? <input type="hidden" name="categoryId" value={query.categoryId} /> : null}
          <button className="button button-primary button-small" type="submit">Filtrar</button>
        </form>

        <div className="blog-category-bar" aria-label="Filtrar por categoría">
          <Link className={!query.categoryId ? "category-chip category-chip-active" : "category-chip"} href={categoryHref(query.search, query.sort, null)}>Todos</Link>
          {catalog.categories.filter((category) => category.parentId === null).map((category) => (
            <Link className={query.categoryId === category.id ? "category-chip category-chip-active" : "category-chip"} href={categoryHref(query.search, query.sort, category.id)} key={category.id}>
              {category.title}
            </Link>
          ))}
        </div>

        {catalog.items.length > 0 ? (
          <div className="blog-list">
            {catalog.items.map((entry) => (
              <article className="blog-card" key={entry.id}>
                <p className="eyebrow">{entry.category?.title ?? "Blog"}</p>
                <h2><Link href={`/blogs/${encodeURIComponent(entry.id)}`}>{entry.title}</Link></h2>
                {entry.excerpt ? <p className="blog-summary">{entry.excerpt}</p> : null}
                <dl className="blog-facts">
                  <div><dt>Autor</dt><dd><Link href={`/profile/${encodeURIComponent(entry.author.username)}`}>{entry.author.displayName}</Link></dd></div>
                  <div><dt>Publicado</dt><dd><time dateTime={entry.createdAt.toISOString()}>{formatDate(entry.createdAt)}</time></dd></div>
                  <div><dt>Actividad</dt><dd>{entry.views} visitas</dd></div>
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">No encontramos entradas visibles con estos filtros.</p>
        )}

        <BlogPagination page={catalog.pagination.page} pageCount={catalog.pagination.pageCount} search={query.search} sort={query.sort} categoryId={query.categoryId} />
      </section>
    </ClientShell>
  );
}

function BlogPagination({ page, pageCount, search, sort, categoryId }: { page: number; pageCount: number; search: string; sort: BlogSort; categoryId: string | null }) {
  if (pageCount <= 1) return null;
  const href = (nextPage: number): string => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (sort !== "created") params.set("sort", sort);
    if (categoryId) params.set("categoryId", categoryId);
    if (nextPage > 1) params.set("page", String(nextPage));
    return `/blogs?${params.toString()}#blogs-title`;
  };
  return <nav className="blog-pagination" aria-label="Paginación de blogs">
    {page > 1 ? <Link className="text-link" href={href(page - 1)}>Anteriores</Link> : <span aria-disabled="true">Anteriores</span>}
    <span aria-current="page">Página {page} de {pageCount}</span>
    {page < pageCount ? <Link className="text-link" href={href(page + 1)}>Siguientes</Link> : <span aria-disabled="true">Siguientes</span>}
  </nav>;
}

function categoryHref(search: string, sort: BlogSort, categoryId: string | null): string {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (sort !== "created") params.set("sort", sort);
  if (categoryId) params.set("categoryId", categoryId);
  const query = params.toString();
  return `/blogs${query ? `?${query}` : ""}#blogs-title`;
}

function formatDate(value: Date): string { return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(value); }
function readString(value: string | string[] | undefined): string | undefined { return Array.isArray(value) ? value[0] : value; }
function readNumber(value: string | string[] | undefined): number | undefined { const raw = readString(value); const number = Number(raw); return Number.isInteger(number) ? number : undefined; }
function readSort(value: string | string[] | undefined): BlogSort | undefined { const raw = readString(value); return raw === "created" || raw === "views" ? raw : undefined; }
