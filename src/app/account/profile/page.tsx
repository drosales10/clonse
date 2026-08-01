import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ProfileFieldsForm } from "@/app/components/profile-fields-form";
import { ProfileSettingsForm } from "@/app/components/profile-settings-form";
import { getCurrentUser } from "@/server/auth/session";
import { getOwnProfileFields, getOwnProfileSettings } from "@/server/profile/service";

export const metadata: Metadata = {
  title: "Ajustes de perfil | Red Social",
  description: "Configura la privacidad y el estado de tu perfil.",
};

export default async function ProfileSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnUrl=/account/profile");

  const [settings, fields] = await Promise.all([
    getOwnProfileSettings(user.id),
    getOwnProfileFields(user.id),
  ]);
  if (!settings) redirect("/login?returnUrl=/account/profile");

  return (
    <main className="authenticated-shell">
      <header className="app-header">
        <Link className="brand" href="/">nexo<span>.</span></Link>
        <nav className="profile-navigation" aria-label="Navegación de cuenta">
          <Link className="text-link" href="/home">Inicio</Link>
          <Link className="text-link" href={`/profile/${encodeURIComponent(settings.username)}`}>Mi perfil</Link>
          <Link className="text-link" href="/account/friends">Conexiones</Link>
          <Link className="text-link" href="/account/blocks">Bloqueos</Link>
        </nav>
      </header>
      <section className="profile-panel settings-panel" aria-labelledby="settings-title">
        <p className="eyebrow">Cuenta · Perfil</p>
        <h1 id="settings-title">Tus ajustes</h1>
        <p className="lead">Controla quién puede encontrar tu perfil y qué estado breve quieres mostrar.</p>
        <ProfileSettingsForm profilePrivacy={settings.profilePrivacy} status={settings.status} username={settings.username} />
      </section>
      <section className="profile-panel settings-panel" aria-labelledby="fields-title">
        <p className="eyebrow">Perfil · Información</p>
        <h2 id="fields-title">Tus campos de perfil</h2>
        <p className="lead">Completa la información que esté configurada para tu cuenta.</p>
        <ProfileFieldsForm fields={fields} />
      </section>
    </main>
  );
}
