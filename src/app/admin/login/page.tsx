import { redirect } from "next/navigation";

import Link from "next/link";

import { AdminLoginForm } from "@/app/components/admin-access-form";
import { getAdminAccessState } from "@/server/admin/access";

export default async function AdminLoginPage() {
  const access = await getAdminAccessState();
  if (access.admin) redirect("/admin/dashboard");

  return (
    <main className="public-shell">
      <section className="auth-card" aria-labelledby="admin-login-title">
        <p className="eyebrow">Administración</p>
        <h1 id="admin-login-title">Acceso administrativo</h1>
        <p className="lead">{access.message}</p>
        <AdminLoginForm />
        <p className="form-footnote"><Link href="/">Volver al sitio</Link></p>
      </section>
    </main>
  );
}
