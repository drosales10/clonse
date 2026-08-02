import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { EditBlogForm } from "@/app/components/blogs/edit-blog-form";
import { BlogBreadcrumb } from "@/app/components/blogs/blog-ui";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getBlogEntryDetail, listActiveBlogCategories } from "@/server/blogs/service";

export const metadata: Metadata = { title: "Editar entrada | nexo." };

export default async function EditBlogPage({ params }: { params: Promise<{ entryId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?returnUrl=/blogs/${encodeURIComponent((await params).entryId)}/edit`);

  const { entryId } = await params;
  const [entry, categories] = await Promise.all([
    getBlogEntryDetail(user.id, entryId),
    listActiveBlogCategories(),
  ]);
  if (!entry) notFound();
  if (!entry.isOwner) redirect(`/blogs/${encodeURIComponent(entryId)}`);

  const cancelHref = `/blogs/${encodeURIComponent(entryId)}`;

  return (
    <ClientShell current="explore">
      <div className="blogs-module">
        <section className="blogs-page blogs-page-narrow">
          <BlogBreadcrumb
            items={[
              { label: "Inicio", href: "/home" },
              { label: "Blogs", href: "/blogs" },
              { label: entry.title, href: cancelHref },
              { label: "Editar" },
            ]}
          />
          <header className="blogs-page-header">
            <h1>Editar entrada</h1>
            <p className="blogs-page-lead">Modifica el título, contenido, categoría o visibilidad en el catálogo.</p>
          </header>
          <EditBlogForm
            body={entry.body}
            cancelHref={cancelHref}
            catalogVisible={entry.catalogVisible}
            categories={categories}
            categoryId={entry.categoryId}
            entryId={entry.id}
            title={entry.title}
          />
        </section>
      </div>
    </ClientShell>
  );
}
