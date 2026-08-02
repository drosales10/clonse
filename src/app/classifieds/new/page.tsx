import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CreateClassifiedForm } from "@/app/components/classifieds/create-classified-form";
import { ClassifiedBreadcrumb } from "@/app/components/classifieds/classified-ui";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { listActiveClassifiedCategories } from "@/server/classifieds/service";

export const metadata: Metadata = {
  title: "Nuevo clasificado | nexo.",
  description: "Publica un clasificado en la comunidad.",
};

export default async function NewClassifiedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnUrl=/classifieds/new");

  const categories = await listActiveClassifiedCategories();

  return (
    <ClientShell current="explore">
      <div className="classifieds-module">
        <section className="classifieds-page classifieds-page-narrow" aria-labelledby="new-classified-title">
          <ClassifiedBreadcrumb
            items={[
              { label: "Inicio", href: "/home" },
              { label: "Clasificados", href: "/classifieds" },
              { label: "Crear clasificado" },
            ]}
          />
          <header className="classifieds-page-header">
            <h1 id="new-classified-title">Crear clasificado</h1>
            <p className="classifieds-page-lead">
              Publica un clasificado visible en el catálogo. Podrás editarlo y ocultarlo después.
            </p>
          </header>
          <CreateClassifiedForm categories={categories} />
        </section>
      </div>
    </ClientShell>
  );
}
