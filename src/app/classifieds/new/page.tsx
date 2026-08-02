import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ClassifiedCreateForm } from "@/app/components/classified-create-form";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { listActiveClassifiedCategories } from "@/server/classifieds/service";

export const metadata: Metadata = {
  title: "Nuevo clasificado | nexo.",
  description: "Publica un clasificado en la comunidad.",
};

export default async function NewClassifiedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnUrl=/classifieds/new");

  const categories = await listActiveClassifiedCategories();

  return (
    <ClientShell current="explore">
      <section className="profile-panel classified-panel" aria-labelledby="new-classified-title">
        <Link className="text-link classified-back-link" href="/classifieds">
          ← Volver a clasificados
        </Link>
        <p className="eyebrow">Comunidad · Clasificados</p>
        <h1 id="new-classified-title">Nuevo clasificado</h1>
        <p className="lead">
          Publica un clasificado visible en el catálogo. Podrás editarlo y ocultarlo desde el detalle.
        </p>
        <ClassifiedCreateForm categories={categories} />
      </section>
    </ClientShell>
  );
}
