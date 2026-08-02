import type { Metadata } from "next";
import Link from "next/link";

import {
  ArticleCategoryBar,
  ArticleGrid,
  ArticlePagination,
  ArticleToolbar,
} from "@/app/components/articles/article-catalog";
import { ArticleEmptyState } from "@/app/components/articles/article-ui";
import { normalizeArticleQuery, type ArticleSort } from "@domain/articles";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getArticleCatalog } from "@/server/articles/service";

export const metadata: Metadata = {
  title: "Artículos | nexo.",
  description: "Descubre artículos visibles y aprobados de la comunidad.",
};

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sortRaw = readString(params.sort);
  const sort: ArticleSort =
    sortRaw === "views" || sortRaw === "title" ? sortRaw : "created";
  const layout = readString(params.layout) === "list" ? "list" : "grid";
  const query = normalizeArticleQuery({
    page: readNumber(params.page),
    search: readString(params.search),
    categoryId: readString(params.categoryId),
    featured: readString(params.featured) === "1",
    sort,
  });
  const viewer = await getCurrentUser();
  const canCreate = Boolean(viewer);
  const catalog = await getArticleCatalog(viewer?.id ?? null, query);

  return (
    <ClientShell current="explore">
      <div className="articles-module">
        <section className="articles-page" aria-labelledby="articles-title" id="articles-catalog">
          <header className="articles-page-header">
            <nav aria-label="Ruta de navegación" className="articles-breadcrumb">
              <ol>
                <li>
                  <Link href="/home">Inicio</Link>
                </li>
                <li>
                  <span aria-current="page">Artículos</span>
                </li>
              </ol>
            </nav>
            <div className="articles-page-heading">
              <div>
                <p className="articles-page-eyebrow">Publicación · Artículos</p>
                <h1 id="articles-title">Conocimiento compartido</h1>
                <p className="articles-page-lead">
                  Explora artículos aprobados, buscables y visibles según la privacidad de cada autor.
                </p>
              </div>
              {canCreate ? (
                <Link className="articles-btn articles-btn-primary" href="/articles/new">
                  Crear artículo
                </Link>
              ) : null}
            </div>
          </header>
          {!viewer ? (
            <aside className="articles-permission-notice" role="note">
              <p>Inicia sesión para crear un artículo.</p>
              <Link className="articles-text-link" href="/login?returnUrl=/articles/new">
                Iniciar sesión
              </Link>
            </aside>
          ) : null}
          <ArticleCategoryBar
            activeCategoryId={query.categoryId}
            categories={catalog.categories}
            featured={query.featured}
            layout={layout}
            search={query.search}
            sort={query.sort}
          />
          <ArticleToolbar
            canCreate={canCreate}
            categoryId={query.categoryId}
            featured={query.featured}
            layout={layout}
            search={query.search}
            sort={query.sort}
            total={catalog.pagination.total}
          />
          {catalog.items.length > 0 ? (
            <ArticleGrid articles={catalog.items} view={layout} />
          ) : (
            <ArticleEmptyState
              action={
                canCreate ? (
                  <Link className="articles-btn articles-btn-primary" href="/articles/new">
                    Crear tu primer artículo
                  </Link>
                ) : undefined
              }
              description="No encontramos artículos visibles con estos filtros."
              title="No hay artículos para mostrar"
            />
          )}
          <ArticlePagination
            categoryId={query.categoryId}
            featured={query.featured}
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
