import type { Metadata } from "next";
import Link from "next/link";

import {
  BlogCategoryBar,
  BlogGrid,
  BlogPagination,
  BlogToolbar,
} from "@/app/components/blogs/blog-catalog";
import { BlogEmptyState } from "@/app/components/blogs/blog-ui";
import { normalizeBlogQuery, type BlogSort } from "@domain/blogs";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getBlogCatalog } from "@/server/blogs/service";

export const metadata: Metadata = {
  title: "Blogs | nexo.",
  description: "Descubre entradas de blog visibles de la comunidad.",
};

export default async function BlogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sortRaw = readString(params.sort);
  const sort: BlogSort = sortRaw === "views" ? "views" : "created";
  const layout = readString(params.layout) === "list" ? "list" : "grid";
  const query = normalizeBlogQuery({
    page: readNumber(params.page),
    search: readString(params.search),
    categoryId: readString(params.categoryId),
    sort,
  });
  const viewer = await getCurrentUser();
  const canCreate = Boolean(viewer);
  const catalog = await getBlogCatalog(viewer?.id ?? null, query);

  return (
    <ClientShell current="explore">
      <div className="blogs-module">
        <section className="blogs-page" aria-labelledby="blogs-title" id="blogs-catalog">
          <header className="blogs-page-header">
            <nav aria-label="Ruta de navegación" className="blogs-breadcrumb">
              <ol>
                <li>
                  <Link href="/home">Inicio</Link>
                </li>
                <li>
                  <span aria-current="page">Blogs</span>
                </li>
              </ol>
            </nav>
            <div className="blogs-page-heading">
              <div>
                <p className="blogs-page-eyebrow">Publicación · Blogs</p>
                <h1 id="blogs-title">Ideas de la comunidad</h1>
                <p className="blogs-page-lead">
                  Explora entradas buscables y visibles según la privacidad de cada autor.
                </p>
              </div>
              {canCreate ? (
                <Link className="blogs-btn blogs-btn-primary" href="/blogs/new">
                  Crear entrada
                </Link>
              ) : null}
            </div>
          </header>
          {!viewer ? (
            <aside className="blogs-permission-notice" role="note">
              <p>Inicia sesión para crear una entrada.</p>
              <Link className="blogs-text-link" href="/login?returnUrl=/blogs/new">
                Iniciar sesión
              </Link>
            </aside>
          ) : null}
          <BlogCategoryBar
            activeCategoryId={query.categoryId}
            categories={catalog.categories}
            layout={layout}
            search={query.search}
            sort={query.sort}
          />
          <BlogToolbar
            canCreate={canCreate}
            categoryId={query.categoryId}
            layout={layout}
            search={query.search}
            sort={query.sort}
            total={catalog.pagination.total}
          />
          {catalog.items.length > 0 ? (
            <BlogGrid entries={catalog.items} view={layout} />
          ) : (
            <BlogEmptyState
              action={
                canCreate ? (
                  <Link className="blogs-btn blogs-btn-primary" href="/blogs/new">
                    Crear tu primera entrada
                  </Link>
                ) : undefined
              }
              description="No encontramos entradas visibles con estos filtros."
              title="No hay entradas para mostrar"
            />
          )}
          <BlogPagination
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
