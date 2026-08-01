import type { Metadata } from "next";

import { RegisterForm } from "@/app/components/access-form";

export const metadata: Metadata = {
  title: "Crear cuenta | Red Social",
  description: "Crea tu cuenta en la red social.",
};

export default function SignupPage() {
  return (
    <main className="public-shell">
      <section className="auth-card auth-card-wide" aria-labelledby="signup-title">
        <p className="eyebrow">Registro</p>
        <h1 id="signup-title">Forma parte de la red</h1>
        <p className="lead">Esta es la primera etapa del registro legacy: identidad, credenciales y aceptación de términos.</p>
        <RegisterForm />
      </section>
    </main>
  );
}
