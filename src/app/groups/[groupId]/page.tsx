import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GroupHeader } from "@/app/components/groups/group-header";
import { GroupMembersSection } from "@/app/components/groups/group-members-section";
import { GroupMembershipPanel } from "@/app/components/groups/group-membership-panel";
import { GroupOwnerMembershipSection } from "@/app/components/groups/group-owner-membership-section";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import {
  getGroupDetail,
  getGroupMembers,
  getGroupPendingMembers,
} from "@/server/groups/service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ groupId: string }>;
}): Promise<Metadata> {
  const { groupId } = await params;
  const viewer = await getCurrentUser();
  const group = await getGroupDetail(viewer?.id ?? null, groupId);
  return { title: group ? `${group.title} | Grupos` : "Grupo | nexo." };
}

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
  const [group, members, pendingMembers] = await Promise.all([
    getGroupDetail(viewer?.id ?? null, groupId),
    getGroupMembers(viewer?.id ?? null, groupId, membersPage),
    viewer ? getGroupPendingMembers(viewer.id, groupId) : Promise.resolve(null),
  ]);
  if (!group || !members) notFound();

  const basePath = `/groups/${encodeURIComponent(group.id)}`;

  return (
    <ClientShell current="explore">
      <div className="groups-module">
        <article className="groups-page groups-detail-page">
          <GroupHeader group={group} />
          <GroupMembershipPanel
            canJoin={group.canJoin}
            groupId={group.id}
            membership={group.membership}
            membershipApprovalRequired={group.membershipApprovalRequired}
          />
          <GroupMembersSection basePath={basePath} members={members} />
          {group.isOwner ? (
            <GroupOwnerMembershipSection
              groupId={group.id}
              pendingMembers={pendingMembers?.items ?? []}
            />
          ) : null}
        </article>
      </div>
    </ClientShell>
  );
}

function readPage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number(raw);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
