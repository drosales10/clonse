import type { Metadata } from "next";

import { RecoveryForm } from "@/app/components/access-form";

export const metadata: Metadata = {
  title: "Recuperar contraseña | Red Social",
  description: "Solicita un enlace para restablecer tu contraseña.",
};

export default function ForgotPasswordPage() {
  return (
    <main className="public-shell">
      <section className="auth-card" aria-labelledby="forgot-title">
        <p className="eyebrow">Recuperación</p>
        <h1 id="forgot-title">Recupera el acceso</h1>
        <p className="lead">Te enviaremos instrucciones para crear una nueva contraseña.</p>
        <RecoveryForm />
      </section>
    </main>
  );
}
