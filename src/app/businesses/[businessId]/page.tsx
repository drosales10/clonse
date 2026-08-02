import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BusinessOwnerControls } from "@/app/components/business-owner-controls";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getBusinessDetail, listActiveBusinessCategories } from "@/server/businesses/service";

export const metadata: Metadata = {
  title: "Negocio | Red Social",
  description: "Consulta un negocio visible de la comunidad.",
};

export default async function BusinessDetailPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const viewer = await getCurrentUser();
  const [business, categories] = await Promise.all([
    getBusinessDetail(viewer?.id ?? null, businessId),
    listActiveBusinessCategories(),
  ]);
  if (!business) notFound();

  return (
    <ClientShell current="explore">
      <article className="profile-panel business-detail-panel" aria-labelledby="business-title">
        <Link className="text-link business-back-link" href="/businesses">
          ← Volver a negocios
        </Link>
        <div className="business-detail-heading">
          <div>
            <p className="eyebrow">{business.category?.title ?? "Negocio"}</p>
            <h1 id="business-title">{business.title}</h1>
          </div>
          {business.sponsored || business.featured ? (
            <span className="business-badge">{business.sponsored ? "Patrocinado" : "Destacado"}</span>
          ) : null}
        </div>
        {!business.catalogVisible && business.isOwner ? (
          <p className="field-help" role="status">
            Este negocio está oculto del catálogo público.
          </p>
        ) : null}
        {business.description ? (
          <p className="business-detail-description">{business.description}</p>
        ) : business.summary ? (
          <p className="business-detail-description">{business.summary}</p>
        ) : null}
        <dl className="business-detail-facts">
          <div>
            <dt>Propietario</dt>
            <dd>
              <Link href={`/profile/${encodeURIComponent(business.owner.username)}`}>
                {business.owner.displayName}
              </Link>
            </dd>
          </div>
          {business.city || business.province || business.country ? (
            <div>
              <dt>Ubicación</dt>
              <dd>{[business.city, business.province, business.country].filter(Boolean).join(", ")}</dd>
            </div>
          ) : null}
          {business.phone ? (
            <div>
              <dt>Teléfono</dt>
              <dd>{business.phone}</dd>
            </div>
          ) : null}
          <div>
            <dt>Visitas</dt>
            <dd>{business.views}</dd>
          </div>
          <div>
            <dt>Comentarios</dt>
            <dd>{business.totalComments}</dd>
          </div>
        </dl>

        {business.isOwner ? (
          <BusinessOwnerControls
            businessId={business.id}
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
        ) : null}

        <p className="business-detail-note">
          La descripción se muestra como texto seguro. Fotos, mapas, ratings, comentarios, claims y pagos requieren
          contratos separados.
        </p>
      </article>
    </ClientShell>
  );
}
