import type { Metadata } from "next";

import { ResetPasswordForm } from "@/app/components/access-form";

export const metadata: Metadata = {
  title: "Nueva contraseña | Red Social",
  description: "Define una nueva contraseña para tu cuenta.",
};

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";

  return (
    <main className="public-shell">
      <section className="auth-card" aria-labelledby="reset-title">
        <p className="eyebrow">Nueva contraseña</p>
        <h1 id="reset-title">Crea una nueva clave</h1>
        <p className="lead">El enlace es de un solo uso y caduca después de 24 horas.</p>
        {token ? <ResetPasswordForm token={token} /> : <p className="form-error" role="alert">El enlace de recuperación no es válido.</p>}
      </section>
    </main>
  );
}
