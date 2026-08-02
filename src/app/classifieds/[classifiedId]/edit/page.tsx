import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { EditClassifiedForm } from "@/app/components/classifieds/edit-classified-form";
import { ClassifiedBreadcrumb } from "@/app/components/classifieds/classified-ui";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getClassifiedDetail, listActiveClassifiedCategories } from "@/server/classifieds/service";

export const metadata: Metadata = { title: "Editar clasificado | nexo." };

export default async function EditClassifiedPage({
  params,
}: {
  params: Promise<{ classifiedId: string }>;
}) {
  const user = await getCurrentUser();
  const { classifiedId } = await params;
  if (!user) redirect(`/login?returnUrl=/classifieds/${encodeURIComponent(classifiedId)}/edit`);

  const [classified, categories] = await Promise.all([
    getClassifiedDetail(user.id, classifiedId),
    listActiveClassifiedCategories(),
  ]);
  if (!classified) notFound();
  if (!classified.isOwner) redirect(`/classifieds/${encodeURIComponent(classifiedId)}`);

  const cancelHref = `/classifieds/${encodeURIComponent(classifiedId)}`;

  return (
    <ClientShell current="explore">
      <div className="classifieds-module">
        <section className="classifieds-page classifieds-page-narrow">
          <ClassifiedBreadcrumb
            items={[
              { label: "Inicio", href: "/home" },
              { label: "Clasificados", href: "/classifieds" },
              { label: classified.title, href: cancelHref },
              { label: "Editar" },
            ]}
          />
          <header className="classifieds-page-header">
            <h1>Editar clasificado</h1>
            <p className="classifieds-page-lead">Modifica el contenido, categoría o visibilidad en el catálogo.</p>
          </header>
          <EditClassifiedForm
            body={classified.body}
            cancelHref={cancelHref}
            catalogVisible={classified.catalogVisible}
            categories={categories}
            categoryId={classified.categoryId}
            classifiedId={classified.id}
            title={classified.title}
          />
        </section>
      </div>
    </ClientShell>
  );
}
