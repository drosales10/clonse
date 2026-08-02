import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { GroupCreateForm } from "@/app/components/group-create-form";
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
      <section className="profile-panel group-panel" aria-labelledby="new-group-title">
        <Link className="text-link group-back-link" href="/groups">
          ← Volver a grupos
        </Link>
        <p className="eyebrow">Comunidad · Grupos</p>
        <h1 id="new-group-title">Nuevo grupo</h1>
        <p className="lead">
          Publica un grupo visible en el catálogo. Podrás editarlo y ocultarlo desde el detalle.
        </p>
        <GroupCreateForm categories={categories} />
      </section>
    </ClientShell>
  );
}
