import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CreateArticleForm } from "@/app/components/articles/create-article-form";
import { ArticleBreadcrumb } from "@/app/components/articles/article-ui";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { listActiveArticleCategories } from "@/server/articles/service";

export const metadata: Metadata = {
  title: "Nuevo artículo | nexo.",
  description: "Publica un artículo en la comunidad.",
};

export default async function NewArticlePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnUrl=/articles/new");

  const categories = await listActiveArticleCategories();

  return (
    <ClientShell current="explore">
      <div className="articles-module">
        <section className="articles-page articles-page-narrow">
          <ArticleBreadcrumb
            items={[
              { label: "Inicio", href: "/home" },
              { label: "Artículos", href: "/articles" },
              { label: "Nuevo artículo" },
            ]}
          />
          <header className="articles-page-header">
            <h1>Nuevo artículo</h1>
            <p className="articles-page-lead">
              Publica un artículo visible en el catálogo. Podrás editarlo y ocultarlo desde el detalle.
            </p>
          </header>
          <CreateArticleForm categories={categories} />
        </section>
      </div>
    </ClientShell>
  );
}
