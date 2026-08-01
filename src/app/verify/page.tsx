import type { Metadata } from "next";

import { ResendVerificationForm, VerifyForm } from "@/app/components/access-form";

export const metadata: Metadata = {
  title: "Verificar email | Red Social",
  description: "Confirma el email de tu cuenta.",
};

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";

  return (
    <main className="public-shell">
      <section className="auth-card" aria-labelledby="verify-title">
        <p className="eyebrow">Verificación</p>
        <h1 id="verify-title">Confirma tu email</h1>
        <p className="lead">Activa tu cuenta para poder iniciar sesión.</p>
        {token ? <VerifyForm token={token} /> : <ResendVerificationForm />}
        {!token ? <p className="form-footnote">Introduce el email usado durante el registro para recibir otro enlace.</p> : null}
      </section>
    </main>
  );
}
