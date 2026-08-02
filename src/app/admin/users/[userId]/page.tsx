import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminUserControls } from "@/app/components/admin-user-controls";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccessState } from "@/server/admin/access";
import { getAdminUserDetail } from "@/server/admin/user-detail";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const { userId } = await params;
  const user = await getAdminUserDetail(userId);
  if (!user) redirect("/admin/users");

  return (
    <AdminShell current="users" title="Detalle de usuario">
      <section className="profile-panel admin-user-detail" aria-labelledby="admin-user-title">
        <Link className="text-link" href="/admin/users">
          ← Volver a usuarios
        </Link>
        <p className="eyebrow">Administración · Detalle de usuario</p>
        <div className="profile-identity">
          <span className="profile-avatar" aria-hidden="true">
            {user.displayName.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <h1 id="admin-user-title">{user.displayName}</h1>
            <p className="profile-username">@{user.username}</p>
          </div>
        </div>
        <dl className="profile-facts admin-user-facts">
          <div>
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd>{user.enabled ? "Habilitado" : "Deshabilitado"}</dd>
          </div>
          <div>
            <dt>Email verificado</dt>
            <dd>{user.verifiedAt ? formatDate(user.verifiedAt) : "No"}</dd>
          </div>
          <div>
            <dt>Alta</dt>
            <dd>{formatDate(user.signUpDate)}</dd>
          </div>
          <div>
            <dt>Último login</dt>
            <dd>{user.lastLoginAt ? formatDate(user.lastLoginAt) : "Nunca"}</dd>
          </div>
          <div>
            <dt>Última actividad</dt>
            <dd>{user.lastActiveAt ? formatDate(user.lastActiveAt) : "Sin registro"}</dd>
          </div>
        </dl>

        <AdminUserControls enabled={user.enabled} userId={user.id} verified={user.verifiedAt !== null} />

        <div className="scope-grid admin-user-stats">
          <article>
            <span>01</span>
            <h2>{user.acceptedConnections}</h2>
            <p>Conexiones aceptadas.</p>
          </article>
          <article>
            <span>02</span>
            <h2>{user.profileCommentsAuthored}</h2>
            <p>Comentarios de perfil authored.</p>
          </article>
          <article>
            <span>03</span>
            <h2>{user.activitiesAuthored}</h2>
            <p>Actividades registradas.</p>
          </article>
        </div>
        <p className="empty-state">
          Cambio de contraseña, niveles, subredes y eliminación siguen pendientes de contratos
          administrativos adicionales.
        </p>
      </section>
    </AdminShell>
  );
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(value);
}
