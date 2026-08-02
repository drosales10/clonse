import type { Metadata } from "next";
import Link from "next/link";

import {
  GroupCategoryBar,
  GroupGrid,
  GroupPagination,
  GroupToolbar,
} from "@/app/components/groups/group-catalog";
import { GroupEmptyState } from "@/app/components/groups/group-ui";
import { normalizeGroupQuery } from "@domain/groups";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getGroupCatalog } from "@/server/groups/service";

export const metadata: Metadata = {
  title: "Grupos | nexo.",
  description: "Descubre grupos visibles de la comunidad.",
};

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const view = readString(params.view) === "list" ? "list" : "grid";
  const query = normalizeGroupQuery({
    page: readNumber(params.page),
    categoryId: readString(params.categoryId),
  });
  const viewer = await getCurrentUser();
  const canCreate = Boolean(viewer);
  const catalog = await getGroupCatalog(viewer?.id ?? null, query);

  return (
    <ClientShell current="explore">
      <div className="groups-module">
        <section className="groups-page" aria-labelledby="groups-title" id="groups-catalog">
          <header className="groups-page-header">
            <nav aria-label="Ruta de navegación" className="groups-breadcrumb">
              <ol>
                <li>
                  <Link href="/home">Inicio</Link>
                </li>
                <li>
                  <span aria-current="page">Grupos</span>
                </li>
              </ol>
            </nav>
            <div className="groups-page-heading">
              <div>
                <h1 id="groups-title">Grupos</h1>
                <p className="groups-page-lead">
                  Encuentra comunidades, únete a grupos y crea el tuyo para conectar con otros miembros.
                </p>
              </div>
              {canCreate ? (
                <Link className="groups-btn groups-btn-primary" href="/groups/new">
                  Crear grupo
                </Link>
              ) : null}
            </div>
          </header>
          {!viewer ? (
            <aside className="groups-permission-notice" role="note">
              <p>Inicia sesión para crear grupos y unirte a la comunidad.</p>
              <Link className="groups-text-link" href="/login?returnUrl=/groups/new">
                Iniciar sesión
              </Link>
            </aside>
          ) : null}
          <GroupCategoryBar
            activeCategoryId={query.categoryId}
            categories={catalog.categories}
            view={view}
          />
          <GroupToolbar
            canCreate={canCreate}
            categoryId={query.categoryId}
            total={catalog.pagination.total}
            view={view}
          />
          {catalog.items.length > 0 ? (
            <GroupGrid groups={catalog.items} view={view} />
          ) : (
            <GroupEmptyState
              action={
                canCreate ? (
                  <Link className="groups-btn groups-btn-primary" href="/groups/new">
                    Crear tu primer grupo
                  </Link>
                ) : undefined
              }
              description="Cuando haya grupos publicados, los verás aquí."
              title="No encontramos grupos con estos filtros"
            />
          )}
          <GroupPagination
            categoryId={query.categoryId}
            page={catalog.pagination.page}
            pageCount={catalog.pagination.pageCount}
            view={view}
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
