import type { Metadata } from "next";
import Link from "next/link";

import { RegisterForm } from "@/app/components/access-form";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Crear cuenta | nexo.",
  description: "Crea tu cuenta en la red social.",
};

export default function SignupPage() {
  return (
    <main className="public-shell">
      <div className="auth-theme-slot">
        <ThemeToggle />
      </div>
      <section className="auth-card auth-card-wide" aria-labelledby="signup-title">
        <Link className="brand brand-mark" href="/">
          nexo<span>.</span>
        </Link>
        <p className="eyebrow">Registro</p>
        <h1 id="signup-title">Forma parte de la red</h1>
        <p className="lead">
          Esta es la primera etapa del registro: identidad, credenciales, aceptación de términos y
          verificación de email.
        </p>
        <RegisterForm />
      </section>
    </main>
  );
}
