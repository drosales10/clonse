import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BlogCreateForm } from "@/app/components/blog-create-form";
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
      <section className="profile-panel blog-panel" aria-labelledby="new-blog-title">
        <Link className="text-link blog-back-link" href="/blogs">
          ← Volver a blogs
        </Link>
        <p className="eyebrow">Publicación · Blogs</p>
        <h1 id="new-blog-title">Nueva entrada</h1>
        <p className="lead">
          Publica una entrada visible en el catálogo. Podrás editarla y ocultarla desde el detalle.
        </p>
        <BlogCreateForm categories={categories} />
      </section>
    </ClientShell>
  );
}
