import Link from "next/link";
import { redirect } from "next/navigation";

import { adminDeleteLanguageVariableAction } from "@/app/actions/admin-content";
import { AdminDeleteForm } from "@/app/components/admin/admin-delete-form";
import { AdminLanguageVariableForm } from "@/app/components/admin/catalog-forms";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";
import { getAdminLanguageVariableDetail } from "@/server/admin/catalog-mutations";

export default async function AdminLanguageVariableDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const { id } = await params;
  const item = await getAdminLanguageVariableDetail(id);
  if (!item) redirect("/admin/language-variables");

  return (
    <AdminShell current="language" title="Detalle de variable">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-detail-title">
        <Link className="text-link" href="/admin/language-variables">
          ← Volver a idioma
        </Link>
        <p className="eyebrow">Administración · Idioma</p>
        <h1 id="admin-detail-title">{`Variable ${item.legacyId}`}</h1>
        <dl className="profile-facts">
          <div>
            <dt>Legacy ID</dt>
            <dd>{item.legacyId}</dd>
          </div>
          <div>
            <dt>Language ID</dt>
            <dd>{item.languageId}</dd>
          </div>
          <div>
            <dt>Valor</dt>
            <dd>{item.value || "—"}</dd>
          </div>
          <div>
            <dt>Fallback</dt>
            <dd>{item.defaultValue || "—"}</dd>
          </div>

        </dl>
        <AdminLanguageVariableForm
          mode="edit"
          variable={{ id: item.id, legacyId: item.legacyId, languageId: item.languageId, value: item.value, defaultValue: item.defaultValue }}
        />
        <AdminDeleteForm
          action={adminDeleteLanguageVariableAction}
          idFieldName="variableId"
          listPath="/admin/language-variables"
          resourceId={item.id}
          resourceLabel={`Variable ${item.legacyId}`}
        />
      </section>
    </AdminShell>
  );
}
