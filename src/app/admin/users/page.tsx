import Link from "next/link";
import { redirect } from "next/navigation";

import { adminLogoutAction } from "@/app/actions/admin";
import { getAdminAccessState } from "@/server/admin/access";
import { getAdminUsers } from "@/server/admin/users";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const params = await searchParams;
  const enabled = readString(params.f_enabled);
  const result = await getAdminUsers({
    userFilter: readString(params.f_user),
    emailFilter: readString(params.f_email),
    enabledFilter: enabled === "1" || enabled === "0" ? enabled : undefined,
    sort: readString(params.s),
    page: parsePage(readString(params.p)),
  });

  return (
    <main className="authenticated-shell admin-shell">
      <header className="app-header">
        <Link className="brand" href="/admin/dashboard">nexo<span>.</span></Link>
        <nav className="profile-navigation" aria-label="Navegación administrativa">
          <Link className="text-link" href="/admin/dashboard">Panel</Link>
          <span className="text-link">Usuarios</span>
          <form action={adminLogoutAction}><button className="button button-quiet" type="submit">Cerrar sesión</button></form>
        </nav>
      </header>
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-users-title">
        <Link className="text-link" href="/admin/dashboard">← Volver al panel</Link>
        <p className="eyebrow">Administración · Usuarios</p>
        <h1 id="admin-users-title">Usuarios</h1>
        <p className="lead">{result.total} usuarios encontrados. Este módulo es de solo lectura en esta fase.</p>
        <form className="admin-filter-form" method="get">
          <label>Usuario o nombre<input name="f_user" defaultValue={result.query.userFilter} /></label>
          <label>Email<input name="f_email" defaultValue={result.query.emailFilter} type="email" /></label>
          <label>Estado<select defaultValue={result.query.enabledFilter ?? ""} name="f_enabled"><option value="">Todos</option><option value="1">Habilitados</option><option value="0">Deshabilitados</option></select></label>
          <input name="s" type="hidden" value={result.query.sort} />
          <button className="button button-primary" type="submit">Filtrar</button>
        </form>
        {result.users.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th scope="col">Usuario</th><th scope="col">Email</th><th scope="col">Estado</th><th scope="col">Verificado</th><th scope="col">Alta</th></tr></thead>
              <tbody>{result.users.map((user) => <tr key={user.id}><th scope="row"><strong>{user.displayName}</strong><small>@{user.username}</small></th><td>{user.email}</td><td>{user.enabled ? "Habilitado" : "Deshabilitado"}</td><td>{user.verifiedAt ? "Sí" : "No"}</td><td><time dateTime={user.signUpDate.toISOString()}>{formatDate(user.signUpDate)}</time></td></tr>)}</tbody>
            </table>
          </div>
        ) : <p className="empty-state">No hay usuarios que coincidan con los filtros.</p>}
        <AdminUsersPagination page={result.page} pageCount={result.pageCount} query={result.query} />
      </section>
    </main>
  );
}

function AdminUsersPagination({ page, pageCount, query }: { page: number; pageCount: number; query: { userFilter: string; emailFilter: string; enabledFilter?: "1" | "0"; sort: string } }) {
  if (pageCount <= 1) return null;
  const href = (nextPage: number) => {
    const params = new URLSearchParams({ p: String(nextPage), s: query.sort });
    if (query.userFilter) params.set("f_user", query.userFilter);
    if (query.emailFilter) params.set("f_email", query.emailFilter);
    if (query.enabledFilter) params.set("f_enabled", query.enabledFilter);
    return `/admin/users?${params.toString()}#admin-users-title`;
  };
  return <nav className="forum-pagination" aria-label="Paginación de usuarios">{page > 1 ? <Link className="text-link" href={href(page - 1)}>Anteriores</Link> : <span>Anterior</span>}<span>Página {page} de {pageCount}</span>{page < pageCount ? <Link className="text-link" href={href(page + 1)}>Siguientes</Link> : <span>Siguiente</span>}</nav>;
}

function readString(value: string | string[] | undefined): string | undefined { return Array.isArray(value) ? value[0] : value; }
function parsePage(value: string | undefined): number { const parsed = Number(value); return Number.isInteger(parsed) && parsed > 0 ? parsed : 1; }
function formatDate(value: Date): string { return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(value); }
