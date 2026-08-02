import Link from "next/link";

import type { PublicGroupMemberRow } from "@domain/groups";

import { rankLabel } from "@/app/components/groups/group-header";
import { MemberListPagination } from "@/app/components/member-list-pagination";

export function GroupMembersSection({
  members,
  basePath,
}: {
  members: {
    items: PublicGroupMemberRow[];
    pagination: { page: number; pageCount: number };
  };
  basePath: string;
}) {
  return (
    <section aria-labelledby="group-members-title" className="groups-members-section">
      <h2 id="group-members-title">Miembros</h2>
      {members.items.length > 0 ? (
        <ul className="groups-member-list">
          {members.items.map((member) => (
            <li key={member.user.username}>
              <Link href={`/profile/${encodeURIComponent(member.user.username)}`}>
                {member.user.displayName}
              </Link>
              <span className="groups-member-meta">
                @{member.user.username} · {rankLabel(member.rank)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="groups-form-help">Todavía no hay miembros públicos.</p>
      )}
      <MemberListPagination
        ariaLabel="Paginación de miembros"
        basePath={basePath}
        page={members.pagination.page}
        pageCount={members.pagination.pageCount}
      />
    </section>
  );
}
