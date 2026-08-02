import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BusinessHeader } from "@/app/components/businesses/business-header";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getBusinessDetail } from "@/server/businesses/service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ businessId: string }>;
}): Promise<Metadata> {
  const { businessId } = await params;
  const viewer = await getCurrentUser();
  const business = await getBusinessDetail(viewer?.id ?? null, businessId);
  return { title: business ? `${business.title} | Negocios` : "Negocio | nexo." };
}

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const viewer = await getCurrentUser();
  const business = await getBusinessDetail(viewer?.id ?? null, businessId);
  if (!business) notFound();

  return (
    <ClientShell current="explore">
      <div className="businesses-module">
        <article className="businesses-page businesses-detail-page">
          <BusinessHeader business={business} />
          <p className="businesses-detail-note">
            La descripción se muestra como texto seguro. Fotos, mapas, valoraciones, comentarios, reclamaciones y
            pagos requieren contratos separados.
          </p>
        </article>
      </div>
    </ClientShell>
  );
}
