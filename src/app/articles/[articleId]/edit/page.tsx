import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { EditArticleForm } from "@/app/components/articles/edit-article-form";
import { ArticleBreadcrumb } from "@/app/components/articles/article-ui";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getArticleDetail, listActiveArticleCategories } from "@/server/articles/service";

export const metadata: Metadata = { title: "Editar artículo | nexo." };

export default async function EditArticlePage({ params }: { params: Promise<{ articleId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?returnUrl=/articles/${encodeURIComponent((await params).articleId)}/edit`);

  const { articleId } = await params;
  const [article, categories] = await Promise.all([
    getArticleDetail(user.id, articleId),
    listActiveArticleCategories(),
  ]);
  if (!article) notFound();
  if (!article.isOwner) redirect(`/articles/${encodeURIComponent(articleId)}`);

  const cancelHref = `/articles/${encodeURIComponent(articleId)}`;

  return (
    <ClientShell current="explore">
      <div className="articles-module">
        <section className="articles-page articles-page-narrow">
          <ArticleBreadcrumb
            items={[
              { label: "Inicio", href: "/home" },
              { label: "Artículos", href: "/articles" },
              { label: article.title, href: cancelHref },
              { label: "Editar" },
            ]}
          />
          <header className="articles-page-header">
            <h1>Editar artículo</h1>
            <p className="articles-page-lead">Modifica el contenido, categoría y visibilidad del artículo.</p>
          </header>
          <EditArticleForm
            articleId={article.id}
            body={article.body}
            cancelHref={cancelHref}
            catalogVisible={article.catalogVisible}
            categories={categories}
            categoryId={article.categoryId}
            title={article.title}
          />
        </section>
      </div>
    </ClientShell>
  );
}
