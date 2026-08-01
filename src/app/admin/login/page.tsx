import Link from "next/link";

import { getAdminAccessState } from "@/server/admin/access";

export default async function AdminLoginPage() {
  const access = await getAdminAccessState();

  return (
    <main className="public-shell">
      <section className="auth-card" aria-labelledby="admin-login-title">
        <p className="eyebrow">Administración</p>
        <h1 id="admin-login-title">Acceso administrativo</h1>
        <p className="lead">{access.message}</p>
        {access.status !== "authenticated" ? (
          <p className="error-message" role="alert">
            El acceso está bloqueado hasta completar la configuración de administradores y el formulario de autenticación server-side.
          </p>
        ) : null}
        <Link className="button button-primary" href="/">Volver al sitio</Link>
      </section>
    </main>
  );
}
