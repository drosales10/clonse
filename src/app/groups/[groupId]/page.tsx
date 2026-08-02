import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { GROUP_MEMBER_RANK } from "@domain/groups";
import { GroupMembershipActions } from "@/app/components/group-membership-actions";
import { GroupOwnerControls } from "@/app/components/group-owner-controls";
import { GroupOwnerMembershipPanel } from "@/app/components/group-owner-membership-panel";
import { MemberListPagination } from "@/app/components/member-list-pagination";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import {
  getGroupDetail,
  getGroupMembers,
  getGroupPendingMembers,
  listActiveGroupCategories,
} from "@/server/groups/service";

export const metadata: Metadata = {
  title: "Grupo | nexo.",
  description: "Consulta un grupo visible de la comunidad.",
};

export default async function GroupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { groupId } = await params;
  const query = await searchParams;
  const membersPage = readPage(query.membersPage);
  const viewer = await getCurrentUser();
  const [group, categories, members, pendingMembers] = await Promise.all([
    getGroupDetail(viewer?.id ?? null, groupId),
    listActiveGroupCategories(),
    getGroupMembers(viewer?.id ?? null, groupId, membersPage),
    viewer ? getGroupPendingMembers(viewer.id, groupId) : Promise.resolve(null),
  ]);
  if (!group || !members) notFound();

  const basePath = `/groups/${encodeURIComponent(group.id)}`;

  return (
    <ClientShell current="explore">
      <article className="profile-panel group-detail-panel" aria-labelledby="group-title">
        <Link className="text-link group-back-link" href="/groups">
          ← Volver a grupos
        </Link>
        <p className="eyebrow">{group.category?.title ?? "Grupo"}</p>
        <h1 id="group-title">{group.title}</h1>
        {!group.catalogVisible && group.isOwner ? (
          <p className="field-help" role="status">
            Este grupo está oculto del catálogo público.
          </p>
        ) : null}
        {group.membershipApprovalRequired ? (
          <p className="field-help" role="status">
            Las solicitudes de membresía requieren aprobación del propietario.
          </p>
        ) : null}
        {group.description ? (
          <div className="group-detail-description">{group.description}</div>
        ) : (
          <p className="empty-state">Este grupo no tiene descripción.</p>
        )}
        <dl className="group-detail-facts">
          <div>
            <dt>Propietario</dt>
            <dd>
              <Link href={`/profile/${encodeURIComponent(group.owner.username)}`}>
                {group.owner.displayName}
              </Link>
            </dd>
          </div>
          <div>
            <dt>Creado</dt>
            <dd>
              <time dateTime={group.createdAt.toISOString()}>{formatDate(group.createdAt)}</time>
            </dd>
          </div>
          <div>
            <dt>Miembros</dt>
            <dd>{group.memberCount}</dd>
          </div>
          {group.isOwner && group.pendingCount > 0 ? (
            <div>
              <dt>Pendientes</dt>
              <dd>{group.pendingCount}</dd>
            </div>
          ) : null}
        </dl>

        <GroupMembershipActions
          canJoin={group.canJoin}
          groupId={group.id}
          membership={group.membership}
          membershipApprovalRequired={group.membershipApprovalRequired}
        />

        <section className="member-list-panel" aria-labelledby="group-members-title">
          <h2 id="group-members-title">Miembros</h2>
          {members.items.length > 0 ? (
            <ul className="member-list">
              {members.items.map((member) => (
                <li key={member.user.username}>
                  <Link href={`/profile/${encodeURIComponent(member.user.username)}`}>
                    {member.user.displayName}
                  </Link>
                  <span className="member-list-meta">
                    @{member.user.username} · {rankLabel(member.rank)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">Todavía no hay miembros públicos.</p>
          )}
          <MemberListPagination
            ariaLabel="Paginación de miembros"
            basePath={basePath}
            page={members.pagination.page}
            pageCount={members.pagination.pageCount}
          />
        </section>

        {group.isOwner ? (
          <>
            <GroupOwnerMembershipPanel
              groupId={group.id}
              pendingMembers={pendingMembers?.items ?? []}
            />
            <GroupOwnerControls
              catalogVisible={group.catalogVisible}
              categories={categories}
              categoryId={group.categoryId}
              description={group.description}
              groupId={group.id}
              membershipApprovalRequired={group.membershipApprovalRequired}
              title={group.title}
            />
          </>
        ) : null}
      </article>
    </ClientShell>
  );
}

function readPage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number(raw);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function rankLabel(rank: number): string {
  if (rank === GROUP_MEMBER_RANK.OWNER) return "Propietario";
  if (rank === GROUP_MEMBER_RANK.OFFICIAL) return "Oficial";
  return "Miembro";
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(value);
}
