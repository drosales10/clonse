import { redirect } from "next/navigation";

import Link from "next/link";

import { AdminLoginForm } from "@/app/components/admin-access-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { getAdminAccessState } from "@/server/admin/access";

export default async function AdminLoginPage() {
  const access = await getAdminAccessState();
  if (access.admin) redirect("/admin/dashboard");

  return (
    <main className="public-shell">
      <div className="auth-theme-slot">
        <ThemeToggle />
      </div>
      <section className="auth-card admin-auth-card" aria-labelledby="admin-login-title">
        <p className="eyebrow">Operaciones</p>
        <h1 id="admin-login-title">nexo. ops</h1>
        <p className="lead">{access.message}</p>
        <AdminLoginForm />
        <p className="form-footnote">
          <Link href="/">Volver al sitio</Link>
        </p>
      </section>
    </main>
  );
}
