import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ArticleCreateForm } from "@/app/components/article-create-form";
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
      <section className="profile-panel article-panel" aria-labelledby="new-article-title">
        <Link className="text-link article-back-link" href="/articles">
          ← Volver a artículos
        </Link>
        <p className="eyebrow">Publicación · Artículos</p>
        <h1 id="new-article-title">Nuevo artículo</h1>
        <p className="lead">
          Publica un artículo visible en el catálogo. Podrás editarlo y ocultarlo desde el detalle.
        </p>
        <ArticleCreateForm categories={categories} />
      </section>
    </ClientShell>
  );
}
