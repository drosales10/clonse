import type { Metadata } from "next";
import Link from "next/link";

import {
  BusinessCategoryBar,
  BusinessGrid,
  BusinessPagination,
  BusinessToolbar,
} from "@/app/components/businesses/business-catalog";
import { BusinessEmptyState } from "@/app/components/businesses/business-ui";
import { normalizeBusinessQuery, type BusinessSort } from "@domain/businesses";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getBusinessCatalog } from "@/server/businesses/service";

export const metadata: Metadata = {
  title: "Negocios | nexo.",
  description: "Descubre negocios visibles de la comunidad.",
};

export default async function BusinessesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const layout = readString(params.layout) === "list" ? "list" : "grid";
  const query = normalizeBusinessQuery({
    page: readNumber(params.page),
    search: readString(params.search),
    categoryId: readString(params.categoryId),
    sort: readSort(params.sort),
  });
  const viewer = await getCurrentUser();
  const canCreate = Boolean(viewer);
  const catalog = await getBusinessCatalog(viewer?.id ?? null, query);

  return (
    <ClientShell current="explore">
      <div className="businesses-module">
        <section className="businesses-page" aria-labelledby="businesses-title" id="businesses-catalog">
          <header className="businesses-page-header">
            <nav aria-label="Ruta de navegación" className="businesses-breadcrumb">
              <ol>
                <li>
                  <Link href="/home">Inicio</Link>
                </li>
                <li>
                  <span aria-current="page">Negocios</span>
                </li>
              </ol>
            </nav>
            <div className="businesses-page-heading">
              <div>
                <h1 id="businesses-title">Negocios</h1>
                <p className="businesses-page-lead">
                  Explora negocios aprobados y visibles. Publica el tuyo para que la comunidad te encuentre.
                </p>
              </div>
              {canCreate ? (
                <Link className="businesses-btn businesses-btn-primary" href="/businesses/new">
                  Crear negocio
                </Link>
              ) : null}
            </div>
          </header>
          {!viewer ? (
            <aside className="businesses-permission-notice" role="note">
              <p>Inicia sesión para crear negocios.</p>
              <Link className="businesses-text-link" href="/login?returnUrl=/businesses/new">
                Iniciar sesión
              </Link>
            </aside>
          ) : null}
          <BusinessCategoryBar
            activeCategoryId={query.categoryId}
            categories={catalog.categories}
            layout={layout}
            search={query.search}
            sort={query.sort}
          />
          <BusinessToolbar
            canCreate={canCreate}
            categoryId={query.categoryId}
            layout={layout}
            search={query.search}
            sort={query.sort}
            total={catalog.pagination.total}
          />
          {catalog.items.length > 0 ? (
            <BusinessGrid businesses={catalog.items} layout={layout} sort={query.sort} />
          ) : (
            <BusinessEmptyState
              action={
                canCreate ? (
                  <Link className="businesses-btn businesses-btn-primary" href="/businesses/new">
                    Crear tu primer negocio
                  </Link>
                ) : undefined
              }
              description="Cuando haya negocios publicados, los verás aquí."
              title="No encontramos negocios con estos filtros"
            />
          )}
          <BusinessPagination
            categoryId={query.categoryId}
            layout={layout}
            page={catalog.pagination.page}
            pageCount={catalog.pagination.pageCount}
            search={query.search}
            sort={query.sort}
          />
        </section>
      </div>
    </ClientShell>
  );
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
  return raw === "updated" ||
    raw === "rating" ||
    raw === "views" ||
    raw === "comments" ||
    raw === "created"
    ? raw
    : undefined;
}
