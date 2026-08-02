import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { EditGroupForm } from "@/app/components/groups/edit-group-form";
import { GroupBreadcrumb } from "@/app/components/groups/group-ui";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getGroupDetail, listActiveGroupCategories } from "@/server/groups/service";

export const metadata: Metadata = { title: "Editar grupo | nexo." };

export default async function EditGroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?returnUrl=/groups/${encodeURIComponent((await params).groupId)}/edit`);

  const { groupId } = await params;
  const [group, categories] = await Promise.all([
    getGroupDetail(user.id, groupId),
    listActiveGroupCategories(),
  ]);
  if (!group) notFound();
  if (!group.isOwner) redirect(`/groups/${encodeURIComponent(groupId)}`);

  const cancelHref = `/groups/${encodeURIComponent(groupId)}`;

  return (
    <ClientShell current="explore">
      <div className="groups-module">
        <section className="groups-page groups-page-narrow">
          <GroupBreadcrumb
            items={[
              { label: "Inicio", href: "/home" },
              { label: "Grupos", href: "/groups" },
              { label: group.title, href: cancelHref },
              { label: "Editar" },
            ]}
          />
          <header className="groups-page-header">
            <h1>Editar grupo</h1>
            <p className="groups-page-lead">Modifica la información, visibilidad y reglas de membresía.</p>
          </header>
          <EditGroupForm
            cancelHref={cancelHref}
            catalogVisible={group.catalogVisible}
            categories={categories}
            categoryId={group.categoryId}
            description={group.description}
            groupId={group.id}
            membershipApprovalRequired={group.membershipApprovalRequired}
            title={group.title}
          />
        </section>
      </div>
    </ClientShell>
  );
}
