import Link from "next/link";

import { GROUP_MEMBER_RANK, type PublicGroupDetail } from "@domain/groups";

import { GroupBreadcrumb } from "@/app/components/groups/group-ui";
import { formatGroupDateTime, ownerInitials } from "@/app/components/groups/utils";

export function GroupHeader({ group }: { group: PublicGroupDetail }) {
  return (
    <header className="groups-detail-header">
      <GroupBreadcrumb
        items={[
          { label: "Inicio", href: "/home" },
          { label: "Grupos", href: "/groups" },
          { label: group.title },
        ]}
      />
      <div className="groups-detail-heading">
        <div>
          <span className="groups-category-badge">{group.category?.title ?? "Grupo"}</span>
          <h1>{group.title}</h1>
          {group.description ? (
            <p className="groups-detail-description">{group.description}</p>
          ) : (
            <p className="groups-detail-description groups-detail-description-muted">Sin descripción.</p>
          )}
          {!group.catalogVisible && group.isOwner ? (
            <p className="groups-inline-notice" role="status">
              Este grupo está oculto del catálogo público.
            </p>
          ) : null}
          {group.membershipApprovalRequired ? (
            <p className="groups-form-help" role="status">
              Las solicitudes de membresía requieren aprobación del propietario.
            </p>
          ) : null}
        </div>
        <div className="groups-detail-actions">
          <Link className="groups-btn groups-btn-secondary" href="/groups">
            Volver a Grupos
          </Link>
          {group.isOwner ? (
            <Link className="groups-btn groups-btn-primary" href={`/groups/${encodeURIComponent(group.id)}/edit`}>
              Editar grupo
            </Link>
          ) : null}
        </div>
      </div>
      <div className="groups-detail-owner">
        <span aria-hidden="true" className="groups-avatar groups-avatar-lg">
          {ownerInitials(group.owner.displayName)}
        </span>
        <div>
          <Link href={`/profile/${encodeURIComponent(group.owner.username)}`}>{group.owner.displayName}</Link>
          <p>@{group.owner.username}</p>
        </div>
      </div>
      <dl className="groups-detail-facts">
        <div>
          <dt>Creado</dt>
          <dd>
            <time dateTime={group.createdAt.toISOString()}>{formatGroupDateTime(group.createdAt)}</time>
          </dd>
        </div>
        <div>
          <dt>Miembros</dt>
          <dd>{group.memberCount}</dd>
        </div>
        <div>
          <dt>Visitas</dt>
          <dd>{group.views}</dd>
        </div>
        {group.isOwner && group.pendingCount > 0 ? (
          <div>
            <dt>Pendientes</dt>
            <dd>{group.pendingCount}</dd>
          </div>
        ) : null}
      </dl>
    </header>
  );
}

export function rankLabel(rank: number): string {
  if (rank === GROUP_MEMBER_RANK.OWNER) return "Propietario";
  if (rank === GROUP_MEMBER_RANK.OFFICIAL) return "Oficial";
  return "Miembro";
}
