import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "@/app/components/access-form";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Iniciar sesión | nexo.",
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
      <div className="auth-theme-slot">
        <ThemeToggle />
      </div>
      <section className="auth-card" aria-labelledby="login-title">
        <Link className="brand brand-mark" href="/">
          nexo<span>.</span>
        </Link>
        <p className="eyebrow">Acceso</p>
        <h1 id="login-title">Vuelve a tu red</h1>
        <p className="lead">Inicia sesión para consultar tu actividad, mensajes y conexiones.</p>
        <LoginForm returnUrl={returnUrl} />
      </section>
    </main>
  );
}
