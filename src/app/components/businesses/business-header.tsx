import Link from "next/link";

import type { PublicBusinessDetail } from "@domain/businesses";

import { BusinessBreadcrumb } from "@/app/components/businesses/business-ui";
import { formatBusinessDateTime, locationLabel, ownerInitials } from "@/app/components/businesses/utils";

function businessUrlHref(url: string): { href: string; external: boolean } {
  if (/^https?:\/\//i.test(url)) return { href: url, external: true };
  return { href: url.startsWith("/") ? url : `/${url}`, external: false };
}

export function BusinessHeader({ business }: { business: PublicBusinessDetail }) {
  const place = locationLabel(business.city, business.province, business.country);
  const urlInfo = business.url ? businessUrlHref(business.url) : null;

  return (
    <header className="businesses-detail-header">
      <BusinessBreadcrumb
        items={[
          { label: "Inicio", href: "/home" },
          { label: "Negocios", href: "/businesses" },
          { label: business.title },
        ]}
      />
      <div className="businesses-detail-heading">
        <div>
          <div className="businesses-detail-badges">
            <span className="businesses-category-badge">{business.category?.title ?? "Negocio"}</span>
            {business.sponsored ? (
              <span className="businesses-badge businesses-badge-sponsored">Patrocinado</span>
            ) : business.featured ? (
              <span className="businesses-badge businesses-badge-featured">Destacado</span>
            ) : null}
          </div>
          <h1>{business.title}</h1>
          {business.description ? (
            <p className="businesses-detail-description">{business.description}</p>
          ) : business.summary ? (
            <p className="businesses-detail-description">{business.summary}</p>
          ) : (
            <p className="businesses-detail-description businesses-detail-description-muted">Sin descripción.</p>
          )}
          {!business.catalogVisible && business.isOwner ? (
            <p className="businesses-inline-notice" role="status">
              Este negocio está oculto del catálogo público.
            </p>
          ) : null}
        </div>
        <div className="businesses-detail-actions">
          <Link className="businesses-btn businesses-btn-secondary" href="/businesses">
            Volver a Negocios
          </Link>
          {business.isOwner ? (
            <Link
              className="businesses-btn businesses-btn-primary"
              href={`/businesses/${encodeURIComponent(business.id)}/edit`}
            >
              Editar negocio
            </Link>
          ) : null}
        </div>
      </div>
      <div className="businesses-detail-owner">
        <span aria-hidden="true" className="businesses-avatar businesses-avatar-lg">
          {ownerInitials(business.owner.displayName)}
        </span>
        <div>
          <Link href={`/profile/${encodeURIComponent(business.owner.username)}`}>
            {business.owner.displayName}
          </Link>
          <p>@{business.owner.username}</p>
        </div>
      </div>
      <dl className="businesses-detail-facts">
        <div>
          <dt>Ubicación</dt>
          <dd>{place}</dd>
        </div>
        {business.phone ? (
          <div>
            <dt>Teléfono</dt>
            <dd>
              <a href={`tel:${business.phone.replace(/\s+/g, "")}`}>{business.phone}</a>
            </dd>
          </div>
        ) : null}
        {urlInfo ? (
          <div>
            <dt>Sitio web</dt>
            <dd>
              {urlInfo.external ? (
                <a href={urlInfo.href} rel="noopener noreferrer" target="_blank">
                  {business.url}
                </a>
              ) : (
                <Link href={urlInfo.href}>{business.url}</Link>
              )}
            </dd>
          </div>
        ) : null}
        <div>
          <dt>Creado</dt>
          <dd>
            <time dateTime={business.createdAt.toISOString()}>{formatBusinessDateTime(business.createdAt)}</time>
          </dd>
        </div>
        <div>
          <dt>Visitas</dt>
          <dd>{business.views}</dd>
        </div>
        <div>
          <dt>Comentarios</dt>
          <dd>{business.totalComments}</dd>
        </div>
      </dl>
    </header>
  );
}
