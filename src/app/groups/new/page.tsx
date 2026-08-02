import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CreateGroupForm } from "@/app/components/groups/create-group-form";
import { GroupBreadcrumb } from "@/app/components/groups/group-ui";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { listActiveGroupCategories } from "@/server/groups/service";

export const metadata: Metadata = {
  title: "Nuevo grupo | nexo.",
  description: "Crea un grupo para la comunidad.",
};

export default async function NewGroupPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnUrl=/groups/new");

  const categories = await listActiveGroupCategories();

  return (
    <ClientShell current="explore">
      <div className="groups-module">
        <section className="groups-page groups-page-narrow">
          <GroupBreadcrumb
            items={[
              { label: "Inicio", href: "/home" },
              { label: "Grupos", href: "/groups" },
              { label: "Nuevo grupo" },
            ]}
          />
          <header className="groups-page-header">
            <h1>Nuevo grupo</h1>
            <p className="groups-page-lead">
              Publica un grupo visible en el catálogo. Podrás editarlo y gestionar miembros desde el detalle.
            </p>
          </header>
          <CreateGroupForm categories={categories} />
        </section>
      </div>
    </ClientShell>
  );
}
