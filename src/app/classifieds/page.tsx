import type { Metadata } from "next";
import Link from "next/link";

import { normalizeClassifiedQuery, type ClassifiedSort } from "@domain/classifieds";
import { getCurrentUser } from "@/server/auth/session";
import { getClassifiedCatalog } from "@/server/classifieds/service";
import { ClientShell } from "@/components/client/ClientShell";

export const metadata: Metadata = {
  title: "Clasificados | Red Social",
  description: "Explora clasificados visibles de la comunidad.",
};

export default async function ClassifiedsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = normalizeClassifiedQuery({
    page: readNumber(params.page),
    search: readString(params.search),
    categoryId: readString(params.categoryId),
    sort: readSort(params.sort),
  });
  const viewer = await getCurrentUser();
  const catalog = await getClassifiedCatalog(viewer?.id ?? null, query);

  return (
    <ClientShell current="explore">
      <section className="profile-panel classified-panel" aria-labelledby="classifieds-title">
        <p className="eyebrow">Comunidad · Clasificados</p>
        <h1 id="classifieds-title">Encuentra lo que buscas</h1>
        <p className="lead">Explora publicaciones buscables y visibles según la privacidad de cada propietario.</p>

        <div className="poll-toolbar">
          {viewer ? (
            <Link className="button button-primary button-small" href="/classifieds/new">
              Crear clasificado
            </Link>
          ) : (
            <Link className="text-link" href="/login?returnUrl=/classifieds/new">
              Inicia sesión para crear un clasificado
            </Link>
          )}
        </div>

        <form className="classified-filters" method="get">
          <div className="classified-filter-search">
            <label htmlFor="classified-search">Buscar</label>
            <input id="classified-search" name="search" defaultValue={query.search} maxLength={100} placeholder="Título o descripción" />
          </div>
          <div>
            <label htmlFor="classified-sort">Ordenar</label>
            <select id="classified-sort" name="sort" defaultValue={query.sort}>
              <option value="created">Más recientes</option>
              <option value="updated">Actualizados</option>
              <option value="views">Más vistos</option>
              <option value="comments">Más comentados</option>
            </select>
          </div>
          {query.categoryId ? <input type="hidden" name="categoryId" value={query.categoryId} /> : null}
          <button className="button button-primary button-small" type="submit">Filtrar</button>
        </form>

        <div className="classified-category-bar" aria-label="Filtrar por categoría">
          <Link className={!query.categoryId ? "category-chip category-chip-active" : "category-chip"} href={categoryHref(query.search, query.sort, null)}>Todos</Link>
          {catalog.categories.filter((category) => category.parentId === null).map((category) => (
            <Link className={query.categoryId === category.id ? "category-chip category-chip-active" : "category-chip"} href={categoryHref(query.search, query.sort, category.id)} key={category.id}>
              {category.title}
            </Link>
          ))}
        </div>

        {catalog.items.length > 0 ? (
          <div className="classified-list">
            {catalog.items.map((classified) => (
              <article className="classified-card" key={classified.id}>
                <p className="eyebrow">{classified.category?.title ?? "Clasificado"}</p>
                <h2><Link className="classified-card-link" href={`/classifieds/${encodeURIComponent(classified.id)}`}>{classified.title}</Link></h2>
                {classified.body ? <p className="classified-summary">{classified.body}</p> : null}
                <dl className="classified-facts">
                  <div><dt>Propietario</dt><dd><Link href={`/profile/${encodeURIComponent(classified.owner.username)}`}>{classified.owner.displayName}</Link></dd></div>
                  <div><dt>Actividad</dt><dd>{classified.views} visitas · {classified.totalComments} comentarios</dd></div>
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">No encontramos clasificados visibles con estos filtros.</p>
        )}

        <ClassifiedPagination page={catalog.pagination.page} pageCount={catalog.pagination.pageCount} search={query.search} sort={query.sort} categoryId={query.categoryId} />
      </section>
    </ClientShell>
  );
}

function ClassifiedPagination({ page, pageCount, search, sort, categoryId }: { page: number; pageCount: number; search: string; sort: ClassifiedSort; categoryId: string | null }) {
  if (pageCount <= 1) return null;
  const href = (nextPage: number): string => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (sort !== "created") params.set("sort", sort);
    if (categoryId) params.set("categoryId", categoryId);
    if (nextPage > 1) params.set("page", String(nextPage));
    return `/classifieds?${params.toString()}#classifieds-title`;
  };
  return <nav className="classified-pagination" aria-label="Paginación de clasificados">
    {page > 1 ? <Link className="text-link" href={href(page - 1)}>Anteriores</Link> : <span aria-disabled="true">Anteriores</span>}
    <span aria-current="page">Página {page} de {pageCount}</span>
    {page < pageCount ? <Link className="text-link" href={href(page + 1)}>Siguientes</Link> : <span aria-disabled="true">Siguientes</span>}
  </nav>;
}

function categoryHref(search: string, sort: ClassifiedSort, categoryId: string | null): string {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (sort !== "created") params.set("sort", sort);
  if (categoryId) params.set("categoryId", categoryId);
  const query = params.toString();
  return `/classifieds${query ? `?${query}` : ""}#classifieds-title`;
}

function readString(value: string | string[] | undefined): string | undefined { return Array.isArray(value) ? value[0] : value; }
function readNumber(value: string | string[] | undefined): number | undefined { const raw = readString(value); const number = Number(raw); return Number.isInteger(number) ? number : undefined; }
function readSort(value: string | string[] | undefined): ClassifiedSort | undefined {
  const raw = readString(value);
  return raw === "updated" || raw === "views" || raw === "comments" || raw === "created" ? raw : undefined;
}
