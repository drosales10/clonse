import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminArticleControls } from "@/app/components/admin-catalog-controls";
import { AdminListToolbar } from "@/app/components/admin/admin-list-toolbar";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";
import { listAdminArticles } from "@/server/admin/article-mutations";

export default async function AdminArticlesPage() {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const articles = await listAdminArticles();

  return (
    <AdminShell current="articles" title="Artículos">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-articles-title">
        <p className="eyebrow">Administración · Artículos</p>
        <h1 id="admin-articles-title">Artículos</h1>
        <p className="lead">{articles.length} artículos. Controla la visibilidad en el catálogo cliente.</p>
        <AdminListToolbar
          listHref="/admin/articles"
          listLabel="Artículos"
          newHref="/admin/articles/new"
          newLabel="Nuevo artículo"
        />

        {articles.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Título</th>
                  <th scope="col">Autor</th>
                  <th scope="col">Categoría</th>
                  <th scope="col">Catálogo</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr key={article.id}>
                    <th scope="row">
                      <Link className="admin-user-link" href={`/admin/articles/${encodeURIComponent(article.id)}`}>
                        <strong>{article.title}</strong>
                        <small>{formatDate(article.publishedAt)}</small>
                      </Link>
                    </th>
                    <td>@{article.author.username}</td>
                    <td>{article.category?.title ?? "—"}</td>
                    <td>{article.catalogVisible ? "Visible" : "Oculto"}</td>
                    <td>
                      <AdminArticleControls articleId={article.id} catalogVisible={article.catalogVisible} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">Todavía no hay artículos registrados.</p>
        )}
      </section>
    </AdminShell>
  );
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(value);
}
