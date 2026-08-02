import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminAccessState } from "@/server/admin/access";
import { getAdminLevels, getAdminSubnetworks } from "@/server/admin/catalogs";
import { getAdminUsers } from "@/server/admin/users";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const params = await searchParams;
  const enabled = readTriState(params.f_enabled);
  const verified = readTriState(params.f_verified);

  const [result, levels, subnetworks] = await Promise.all([
    getAdminUsers({
      userFilter: readString(params.f_user),
      emailFilter: readString(params.f_email),
      enabledFilter: enabled,
      verifiedFilter: verified,
      levelFilter: readString(params.f_level),
      subnetworkFilter: readString(params.f_subnet),
      sort: readString(params.s),
      page: parsePage(readString(params.p)),
    }),
    getAdminLevels(),
    getAdminSubnetworks(),
  ]);

  return (
    <AdminShell current="users" title="Usuarios">
      <section className="profile-panel admin-users-panel" aria-labelledby="admin-users-title">
        <p className="eyebrow">Administración · Usuarios</p>
        <h1 id="admin-users-title">Usuarios</h1>
        <p className="lead">
          {result.total} usuarios encontrados. Desde el detalle puedes gestionar estado, verificación,
          contraseña, nivel, subred y eliminación.
        </p>
        <form className="admin-filter-form" method="get">
          <label>
            Usuario o nombre
            <input name="f_user" defaultValue={result.query.userFilter} />
          </label>
          <label>
            Email
            <input defaultValue={result.query.emailFilter} name="f_email" type="email" />
          </label>
          <label>
            Habilitado
            <select defaultValue={result.query.enabledFilter ?? ""} name="f_enabled">
              <option value="">Todos</option>
              <option value="1">Habilitados</option>
              <option value="0">Deshabilitados</option>
            </select>
          </label>
          <label>
            Verificado
            <select defaultValue={result.query.verifiedFilter ?? ""} name="f_verified">
              <option value="">Todos</option>
              <option value="1">Verificados</option>
              <option value="0">Sin verificar</option>
            </select>
          </label>
          <label>
            Nivel
            <select defaultValue={result.query.levelFilter} name="f_level">
              <option value="">Todos</option>
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Subred
            <select defaultValue={result.query.subnetworkFilter} name="f_subnet">
              <option value="">Todas</option>
              {subnetworks.map((subnetwork) => (
                <option key={subnetwork.id} value={subnetwork.id}>
                  {subnetwork.legacyId ?? subnetwork.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </label>
          <input name="s" type="hidden" value={result.query.sort} />
          <button className="button button-primary" type="submit">
            Filtrar
          </button>
        </form>
        {result.users.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Usuario</th>
                  <th scope="col">Email</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Verificado</th>
                  <th scope="col">Nivel</th>
                  <th scope="col">Subred</th>
                  <th scope="col">Alta</th>
                </tr>
              </thead>
              <tbody>
                {result.users.map((user) => (
                  <tr key={user.id}>
                    <th scope="row">
                      <Link className="admin-user-link" href={`/admin/users/${user.id}`}>
                        <strong>{user.displayName}</strong>
                        <small>@{user.username}</small>
                      </Link>
                    </th>
                    <td>{user.email}</td>
                    <td>{user.enabled ? "Habilitado" : "Deshabilitado"}</td>
                    <td>{user.verifiedAt ? "Sí" : "No"}</td>
                    <td>{user.level?.name ?? "—"}</td>
                    <td>{user.subnetwork?.legacyId ?? "—"}</td>
                    <td>
                      <time dateTime={user.signUpDate.toISOString()}>{formatDate(user.signUpDate)}</time>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">No hay usuarios que coincidan con los filtros.</p>
        )}
        <AdminUsersPagination page={result.page} pageCount={result.pageCount} query={result.query} />
      </section>
    </AdminShell>
  );
}

function AdminUsersPagination({
  page,
  pageCount,
  query,
}: {
  page: number;
  pageCount: number;
  query: {
    userFilter: string;
    emailFilter: string;
    enabledFilter?: "1" | "0";
    verifiedFilter?: "1" | "0";
    levelFilter: string;
    subnetworkFilter: string;
    sort: string;
  };
}) {
  if (pageCount <= 1) return null;
  const href = (nextPage: number) => {
    const params = new URLSearchParams({ p: String(nextPage), s: query.sort });
    if (query.userFilter) params.set("f_user", query.userFilter);
    if (query.emailFilter) params.set("f_email", query.emailFilter);
    if (query.enabledFilter) params.set("f_enabled", query.enabledFilter);
    if (query.verifiedFilter) params.set("f_verified", query.verifiedFilter);
    if (query.levelFilter) params.set("f_level", query.levelFilter);
    if (query.subnetworkFilter) params.set("f_subnet", query.subnetworkFilter);
    return `/admin/users?${params.toString()}#admin-users-title`;
  };
  return (
    <nav className="forum-pagination" aria-label="Paginación de usuarios">
      {page > 1 ? <Link href={href(page - 1)}>Anteriores</Link> : <span>Anterior</span>}
      <span>
        Página {page} de {pageCount}
      </span>
      {page < pageCount ? <Link href={href(page + 1)}>Siguientes</Link> : <span>Siguiente</span>}
    </nav>
  );
}

function readString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function readTriState(value: string | string[] | undefined): "1" | "0" | undefined {
  const raw = readString(value);
  return raw === "1" || raw === "0" ? raw : undefined;
}

function parsePage(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(value);
}
