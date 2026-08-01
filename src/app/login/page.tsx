import type { Metadata } from "next";

import { LoginForm } from "@/app/components/access-form";

export const metadata: Metadata = {
  title: "Iniciar sesión | Red Social",
  description: "Accede a tu cuenta de la red social.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnUrl?: string }>;
}) {
  const params = await searchParams;
  const returnUrl = typeof params.returnUrl === "string" ? params.returnUrl : "/home";

  return (
    <main className="public-shell">
      <section className="auth-card" aria-labelledby="login-title">
        <p className="eyebrow">Acceso</p>
        <h1 id="login-title">Vuelve a tu red</h1>
        <p className="lead">Inicia sesión para consultar tu actividad, mensajes y conexiones.</p>
        <LoginForm returnUrl={returnUrl} />
      </section>
    </main>
  );
}
