import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BusinessCreateForm } from "@/app/components/business-create-form";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { listActiveBusinessCategories } from "@/server/businesses/service";

export const metadata: Metadata = {
  title: "Nuevo negocio | nexo.",
  description: "Registra un negocio en la comunidad.",
};

export default async function NewBusinessPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnUrl=/businesses/new");

  const categories = await listActiveBusinessCategories();

  return (
    <ClientShell current="explore">
      <section className="profile-panel business-panel" aria-labelledby="new-business-title">
        <Link className="text-link business-back-link" href="/businesses">
          ← Volver a negocios
        </Link>
        <p className="eyebrow">Comunidad · Negocios</p>
        <h1 id="new-business-title">Nuevo negocio</h1>
        <p className="lead">
          Publica un negocio visible en el catálogo. Podrás editarlo y ocultarlo desde el detalle.
        </p>
        <BusinessCreateForm categories={categories} />
      </section>
    </ClientShell>
  );
}
