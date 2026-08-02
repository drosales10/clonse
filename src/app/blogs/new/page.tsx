import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CreateBlogForm } from "@/app/components/blogs/create-blog-form";
import { BlogBreadcrumb } from "@/app/components/blogs/blog-ui";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { listActiveBlogCategories } from "@/server/blogs/service";

export const metadata: Metadata = {
  title: "Nueva entrada | nexo.",
  description: "Publica una entrada de blog en la comunidad.",
};

export default async function NewBlogPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnUrl=/blogs/new");

  const categories = await listActiveBlogCategories();

  return (
    <ClientShell current="explore">
      <div className="blogs-module">
        <section className="blogs-page blogs-page-narrow" aria-labelledby="new-blog-title">
          <BlogBreadcrumb
            items={[
              { label: "Inicio", href: "/home" },
              { label: "Blogs", href: "/blogs" },
              { label: "Nueva entrada" },
            ]}
          />
          <header className="blogs-page-header">
            <p className="blogs-page-eyebrow">Publicación · Blogs</p>
            <h1 id="new-blog-title">Nueva entrada</h1>
            <p className="blogs-page-lead">
              Publica una entrada visible en el catálogo. Podrás editarla y ocultarla desde el detalle.
            </p>
          </header>
          <CreateBlogForm categories={categories} />
        </section>
      </div>
    </ClientShell>
  );
}
