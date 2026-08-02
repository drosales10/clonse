import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { EditBusinessForm } from "@/app/components/businesses/edit-business-form";
import { BusinessBreadcrumb } from "@/app/components/businesses/business-ui";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getBusinessDetail, listActiveBusinessCategories } from "@/server/businesses/service";

export const metadata: Metadata = { title: "Editar negocio | nexo." };

export default async function EditBusinessPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?returnUrl=/businesses/${encodeURIComponent((await params).businessId)}/edit`);

  const { businessId } = await params;
  const [business, categories] = await Promise.all([
    getBusinessDetail(user.id, businessId),
    listActiveBusinessCategories(),
  ]);
  if (!business) notFound();
  if (!business.isOwner) redirect(`/businesses/${encodeURIComponent(businessId)}`);

  const cancelHref = `/businesses/${encodeURIComponent(businessId)}`;

  return (
    <ClientShell current="explore">
      <div className="businesses-module">
        <section className="businesses-page businesses-page-narrow">
          <BusinessBreadcrumb
            items={[
              { label: "Inicio", href: "/home" },
              { label: "Negocios", href: "/businesses" },
              { label: business.title, href: cancelHref },
              { label: "Editar" },
            ]}
          />
          <header className="businesses-page-header">
            <h1>Editar negocio</h1>
            <p className="businesses-page-lead">Modifica la información y la visibilidad en el catálogo.</p>
          </header>
          <EditBusinessForm
            businessId={business.id}
            cancelHref={cancelHref}
            catalogVisible={business.catalogVisible}
            categories={categories}
            categoryId={business.categoryId}
            city={business.city}
            country={business.country}
            description={business.description}
            province={business.province}
            summary={business.summary}
            title={business.title}
          />
        </section>
      </div>
    </ClientShell>
  );
}
