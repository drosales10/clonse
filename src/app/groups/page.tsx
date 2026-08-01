import type { Metadata } from "next";
import Link from "next/link";

import { normalizeGroupQuery } from "@domain/groups";
import { getCurrentUser } from "@/server/auth/session";
import { getGroupCatalog } from "@/server/groups/service";

export const metadata: Metadata = {
  title: "Grupos | Red Social",
  description: "Descubre grupos visibles de la comunidad.",
};

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = normalizeGroupQuery({
    page: readNumber(params.page),
    categoryId: readString(params.categoryId),
  });
  const viewer = await getCurrentUser();
  const catalog = await getGroupCatalog(viewer?.id ?? null, query);

  return (
    <main className="authenticated-shell">
      <header className="app-header">
        <Link className="brand" href="/">nexo<span>.</span></Link>
        <nav className="profile-navigation" aria-label="Navegación principal">
          {viewer ? <Link className="text-link" href="/home">Inicio</Link> : <Link className="text-link" href="/login">Iniciar sesión</Link>}
          {viewer ? <Link className="text-link" href={`/profile/${encodeURIComponent(viewer.username)}`}>Mi perfil</Link> : null}
          <Link className="text-link" href="/events">Eventos</Link>
        </nav>
      </header>

      <section className="profile-panel group-panel" aria-labelledby="groups-title">
        <p className="eyebrow">Comunidad · Grupos</p>
        <h1 id="groups-title">Encuentra tu comunidad</h1>
        <p className="lead">Explora grupos que han sido autorizados para aparecer en el catálogo público.</p>

        <div className="group-category-bar" aria-label="Filtrar por categoría">
          <Link className={!query.categoryId ? "category-chip category-chip-active" : "category-chip"} href={categoryHref(null)}>Todos</Link>
          {catalog.categories.filter((category) => category.parentId === null).map((category) => (
            <Link className={query.categoryId === category.id ? "category-chip category-chip-active" : "category-chip"} href={categoryHref(category.id)} key={category.id}>
              {category.title}
            </Link>
          ))}
        </div>

        {catalog.items.length > 0 ? (
          <div className="group-list">
            {catalog.items.map((group) => (
              <article className="group-card" key={group.id}>
                <p className="eyebrow">{group.category?.title ?? "Grupo"}</p>
                <h2><Link className="group-card-link" href={`/groups/${encodeURIComponent(group.id)}`}>{group.title}</Link></h2>
                {group.description ? <p className="group-summary">{group.description}</p> : null}
                <dl className="group-facts">
                  <div><dt>Propietario</dt><dd><Link href={`/profile/${encodeURIComponent(group.owner.username)}`}>{group.owner.displayName}</Link></dd></div>
                  <div><dt>Actividad</dt><dd>{group.views} visitas</dd></div>
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">No encontramos grupos públicos autorizados con estos filtros.</p>
        )}

        <GroupPagination page={catalog.pagination.page} pageCount={catalog.pagination.pageCount} categoryId={query.categoryId} />
      </section>
    </main>
  );
}

function GroupPagination({ page, pageCount, categoryId }: { page: number; pageCount: number; categoryId: string | null }) {
  if (pageCount <= 1) return null;
  const href = (nextPage: number): string => {
    const params = new URLSearchParams();
    if (categoryId) params.set("categoryId", categoryId);
    if (nextPage > 1) params.set("page", String(nextPage));
    return `/groups?${params.toString()}#groups-title`;
  };
  return <nav className="group-pagination" aria-label="Paginación de grupos">
    {page > 1 ? <Link className="text-link" href={href(page - 1)}>Anteriores</Link> : <span aria-disabled="true">Anteriores</span>}
    <span aria-current="page">Página {page} de {pageCount}</span>
    {page < pageCount ? <Link className="text-link" href={href(page + 1)}>Siguientes</Link> : <span aria-disabled="true">Siguientes</span>}
  </nav>;
}

function categoryHref(categoryId: string | null): string {
  return categoryId ? `/groups?categoryId=${encodeURIComponent(categoryId)}#groups-title` : "/groups#groups-title";
}
function readString(value: string | string[] | undefined): string | undefined { return Array.isArray(value) ? value[0] : value; }
function readNumber(value: string | string[] | undefined): number | undefined { const raw = readString(value); const number = Number(raw); return Number.isInteger(number) ? number : undefined; }
