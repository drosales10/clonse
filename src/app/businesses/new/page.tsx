import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CreateBusinessForm } from "@/app/components/businesses/create-business-form";
import { BusinessBreadcrumb } from "@/app/components/businesses/business-ui";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { listActiveBusinessCategories } from "@/server/businesses/service";

export const metadata: Metadata = {
  title: "Nuevo negocio | nexo.",
  description: "Registra un negocio en la comunidad.",
};

export default async function NewBusinessPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnUrl=/businesses/new");

  const categories = await listActiveBusinessCategories();

  return (
    <ClientShell current="explore">
      <div className="businesses-module">
        <section className="businesses-page businesses-page-narrow" aria-labelledby="new-business-title">
          <BusinessBreadcrumb
            items={[
              { label: "Inicio", href: "/home" },
              { label: "Negocios", href: "/businesses" },
              { label: "Nuevo negocio" },
            ]}
          />
          <header className="businesses-page-header">
            <h1 id="new-business-title">Nuevo negocio</h1>
            <p className="businesses-page-lead">
              Publica un negocio visible en el catálogo. Podrás editarlo y ocultarlo después.
            </p>
          </header>
          <CreateBusinessForm categories={categories} />
        </section>
      </div>
    </ClientShell>
  );
}
