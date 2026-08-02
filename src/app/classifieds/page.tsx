import type { Metadata } from "next";
import Link from "next/link";

import {
  ClassifiedCategoryBar,
  ClassifiedGrid,
  ClassifiedPagination,
  ClassifiedToolbar,
} from "@/app/components/classifieds/classified-catalog";
import { ClassifiedEmptyState } from "@/app/components/classifieds/classified-ui";
import { normalizeClassifiedQuery, type ClassifiedSort } from "@domain/classifieds";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getClassifiedCatalog } from "@/server/classifieds/service";

export const metadata: Metadata = {
  title: "Clasificados | nexo.",
  description: "Explora clasificados visibles de la comunidad.",
};

export default async function ClassifiedsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const layout = readString(params.layout) === "list" ? "list" : "grid";
  const query = normalizeClassifiedQuery({
    page: readNumber(params.page),
    search: readString(params.search),
    categoryId: readString(params.categoryId),
    sort: readSort(params.sort),
  });
  const viewer = await getCurrentUser();
  const canCreate = Boolean(viewer);
  const catalog = await getClassifiedCatalog(viewer?.id ?? null, query);

  return (
    <ClientShell current="explore">
      <div className="classifieds-module">
        <section className="classifieds-page" aria-labelledby="classifieds-title" id="classifieds-catalog">
          <header className="classifieds-page-header">
            <nav aria-label="Ruta de navegación" className="classifieds-breadcrumb">
              <ol>
                <li>
                  <Link href="/home">Inicio</Link>
                </li>
                <li>
                  <span aria-current="page">Clasificados</span>
                </li>
              </ol>
            </nav>
            <div className="classifieds-page-heading">
              <div>
                <h1 id="classifieds-title">Clasificados</h1>
                <p className="classifieds-page-lead">
                  Encuentra lo que buscas. Publicaciones buscables y visibles según la privacidad de cada propietario.
                </p>
              </div>
              {canCreate ? (
                <Link className="classifieds-btn classifieds-btn-primary" href="/classifieds/new">
                  Crear clasificado
                </Link>
              ) : null}
            </div>
          </header>
          {!viewer ? (
            <aside className="classifieds-permission-notice" role="note">
              <p>Inicia sesión para crear clasificados.</p>
              <Link className="classifieds-text-link" href="/login?returnUrl=/classifieds/new">
                Iniciar sesión
              </Link>
            </aside>
          ) : null}
          <ClassifiedCategoryBar
            activeCategoryId={query.categoryId}
            categories={catalog.categories}
            layout={layout}
            search={query.search}
            sort={query.sort}
          />
          <ClassifiedToolbar
            canCreate={canCreate}
            categoryId={query.categoryId}
            layout={layout}
            search={query.search}
            sort={query.sort}
            total={catalog.pagination.total}
          />
          {catalog.items.length > 0 ? (
            <ClassifiedGrid classifieds={catalog.items} layout={layout} sort={query.sort} />
          ) : (
            <ClassifiedEmptyState
              action={
                canCreate ? (
                  <Link className="classifieds-btn classifieds-btn-primary" href="/classifieds/new">
                    Crear tu primer clasificado
                  </Link>
                ) : undefined
              }
              description="Cuando haya clasificados publicados, los verás aquí."
              title="No encontramos clasificados con estos filtros"
            />
          )}
          <ClassifiedPagination
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
function readSort(value: string | string[] | undefined): ClassifiedSort | undefined {
  const raw = readString(value);
  return raw === "updated" || raw === "views" || raw === "comments" || raw === "created" ? raw : undefined;
}
