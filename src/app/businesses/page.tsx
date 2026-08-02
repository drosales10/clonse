import type { Metadata } from "next";
import Link from "next/link";

import { normalizeBusinessQuery, type BusinessSort } from "@domain/businesses";
import { getCurrentUser } from "@/server/auth/session";
import { getBusinessCatalog } from "@/server/businesses/service";
import { ClientShell } from "@/components/client/ClientShell";

export const metadata: Metadata = {
  title: "Negocios | Red Social",
  description: "Descubre negocios visibles de la comunidad.",
};

export default async function BusinessesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = normalizeBusinessQuery({
    page: readNumber(params.page),
    search: readString(params.search),
    categoryId: readString(params.categoryId),
    sort: readSort(params.sort),
  });
  const viewer = await getCurrentUser();
  const catalog = await getBusinessCatalog(viewer?.id ?? null, query);

  return (
    <ClientShell current="explore">
      <section className="profile-panel business-panel" aria-labelledby="businesses-title">
        <p className="eyebrow">Comunidad · Negocios</p>
        <h1 id="businesses-title">Encuentra un negocio</h1>
        <p className="lead">Explora negocios aprobados, buscables y visibles para ti.</p>

        <div className="poll-toolbar">
          {viewer ? (
            <Link className="button button-primary button-small" href="/businesses/new">
              Crear negocio
            </Link>
          ) : (
            <Link className="text-link" href="/login?returnUrl=/businesses/new">
              Inicia sesión para crear un negocio
            </Link>
          )}
        </div>

        <form className="business-filters" method="get">
          <div className="business-filter-search">
            <label htmlFor="business-search">Buscar</label>
            <input id="business-search" name="search" defaultValue={query.search} maxLength={100} placeholder="Nombre, resumen o ubicación" />
          </div>
          <div>
            <label htmlFor="business-sort">Ordenar</label>
            <select id="business-sort" name="sort" defaultValue={query.sort}>
              <option value="created">Más recientes</option>
              <option value="updated">Actualizados</option>
              <option value="rating">Mejor valorados</option>
              <option value="views">Más vistos</option>
              <option value="comments">Más comentados</option>
            </select>
          </div>
          {query.categoryId ? <input type="hidden" name="categoryId" value={query.categoryId} /> : null}
          <button className="button button-primary button-small" type="submit">Filtrar</button>
        </form>

        <div className="business-category-bar" aria-label="Filtrar por categoría">
          <Link className={!query.categoryId ? "category-chip category-chip-active" : "category-chip"} href={categoryHref(query.search, query.sort, null)}>
            Todos
          </Link>
          {catalog.categories.filter((category) => category.parentId === null).map((category) => (
            <Link
              className={query.categoryId === category.id ? "category-chip category-chip-active" : "category-chip"}
              href={categoryHref(query.search, query.sort, category.id)}
              key={category.id}
            >
              {category.title}
            </Link>
          ))}
        </div>

        {catalog.items.length > 0 ? (
          <div className="business-list">
            {catalog.items.map((business) => (
              <article className="business-card" key={business.id}>
                <div className="business-card-heading">
                  <div>
                    <p className="eyebrow">{business.category?.title ?? "Negocio"}</p>
                    <h2><Link href={`/businesses/${encodeURIComponent(business.id)}`}>{business.title}</Link></h2>
                  </div>
                  {business.featured || business.sponsored ? <span className="business-badge">{business.sponsored ? "Patrocinado" : "Destacado"}</span> : null}
                </div>
                {business.summary ? <p className="business-summary">{business.summary}</p> : null}
                <dl className="business-facts">
                  <div><dt>Propietario</dt><dd><Link href={`/profile/${encodeURIComponent(business.owner.username)}`}>{business.owner.displayName}</Link></dd></div>
                  {business.city || business.province ? <div><dt>Ubicación</dt><dd>{[business.city, business.province].filter(Boolean).join(", ")}</dd></div> : null}
                  <div><dt>Actividad</dt><dd>{business.views} visitas · {business.totalComments} comentarios</dd></div>
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">No encontramos negocios visibles con estos filtros.</p>
        )}

        <BusinessPagination page={catalog.pagination.page} pageCount={catalog.pagination.pageCount} search={query.search} sort={query.sort} categoryId={query.categoryId} />
      </section>
    </ClientShell>
  );
}

function BusinessPagination({
  page,
  pageCount,
  search,
  sort,
  categoryId,
}: {
  page: number;
  pageCount: number;
  search: string;
  sort: BusinessSort;
  categoryId: string | null;
}) {
  if (pageCount <= 1) return null;
  const href = (nextPage: number): string => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (sort !== "created") params.set("sort", sort);
    if (categoryId) params.set("categoryId", categoryId);
    if (nextPage > 1) params.set("page", String(nextPage));
    return `/businesses?${params.toString()}#businesses-title`;
  };
  return (
    <nav className="business-pagination" aria-label="Paginación de negocios">
      {page > 1 ? <Link className="text-link" href={href(page - 1)}>Anteriores</Link> : <span aria-disabled="true">Anteriores</span>}
      <span aria-current="page">Página {page} de {pageCount}</span>
      {page < pageCount ? <Link className="text-link" href={href(page + 1)}>Siguientes</Link> : <span aria-disabled="true">Siguientes</span>}
    </nav>
  );
}

function categoryHref(search: string, sort: BusinessSort, categoryId: string | null): string {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (sort !== "created") params.set("sort", sort);
  if (categoryId) params.set("categoryId", categoryId);
  const query = params.toString();
  return `/businesses${query ? `?${query}` : ""}#businesses-title`;
}

function readString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function readNumber(value: string | string[] | undefined): number | undefined {
  const raw = readString(value);
  const number = Number(raw);
  return Number.isInteger(number) ? number : undefined;
}

function readSort(value: string | string[] | undefined): BusinessSort | undefined {
  const raw = readString(value);
  return raw === "updated" || raw === "rating" || raw === "views" || raw === "comments" || raw === "created" ? raw : undefined;
}
