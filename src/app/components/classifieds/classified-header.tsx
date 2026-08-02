import Link from "next/link";

import type { PublicClassifiedDetail } from "@domain/classifieds";

import { ClassifiedBreadcrumb } from "@/app/components/classifieds/classified-ui";
import { formatClassifiedDateTime, ownerInitials } from "@/app/components/classifieds/utils";

export function ClassifiedHeader({ classified }: { classified: PublicClassifiedDetail }) {
  return (
    <header className="classifieds-detail-header">
      <ClassifiedBreadcrumb
        items={[
          { label: "Inicio", href: "/home" },
          { label: "Clasificados", href: "/classifieds" },
          { label: classified.title },
        ]}
      />
      <div className="classifieds-detail-heading">
        <div>
          <span className="classifieds-category-badge">{classified.category?.title ?? "Clasificado"}</span>
          <h1>{classified.title}</h1>
          {!classified.catalogVisible && classified.isOwner ? (
            <p className="classifieds-inline-notice" role="status">
              Este clasificado está oculto del catálogo público.
            </p>
          ) : null}
        </div>
        <div className="classifieds-detail-actions">
          <Link className="classifieds-btn classifieds-btn-secondary" href="/classifieds">
            Volver a Clasificados
          </Link>
          {classified.isOwner ? (
            <Link
              className="classifieds-btn classifieds-btn-primary"
              href={`/classifieds/${encodeURIComponent(classified.id)}/edit`}
            >
              Editar clasificado
            </Link>
          ) : null}
        </div>
      </div>
      <div className="classifieds-detail-owner">
        <span aria-hidden="true" className="classifieds-avatar classifieds-avatar-lg">
          {ownerInitials(classified.owner.displayName)}
        </span>
        <div>
          <Link href={`/profile/${encodeURIComponent(classified.owner.username)}`}>
            {classified.owner.displayName}
          </Link>
          <p>@{classified.owner.username}</p>
        </div>
      </div>
      <dl className="classifieds-detail-facts">
        <div>
          <dt>Publicado</dt>
          <dd>
            <time dateTime={classified.createdAt.toISOString()}>
              {formatClassifiedDateTime(classified.createdAt)}
            </time>
          </dd>
        </div>
        <div>
          <dt>Actualizado</dt>
          <dd>
            <time dateTime={classified.updatedAt.toISOString()}>
              {formatClassifiedDateTime(classified.updatedAt)}
            </time>
          </dd>
        </div>
        <div>
          <dt>Visitas</dt>
          <dd>{classified.views}</dd>
        </div>
        <div>
          <dt>Comentarios</dt>
          <dd>{classified.totalComments}</dd>
        </div>
      </dl>
    </header>
  );
}
