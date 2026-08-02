import { DeleteAccountForm, PasswordChangeForm } from "@/app/components/access-form";
import { ProfileFieldsForm } from "@/app/components/profile-fields-form";
import { ProfileSettingsForm } from "@/app/components/profile-settings-form";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/server/auth/session";
import { getOwnProfileFields, getOwnProfileSettings } from "@/server/profile/service";
import { ClientShell } from "@/components/client/ClientShell";

export const metadata: Metadata = {
  title: "Ajustes de perfil | Red Social",
  description: "Configura la privacidad y el estado de tu perfil.",
};

export default async function ProfileSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ security?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnUrl=/account/profile");

  const [settings, fields] = await Promise.all([
    getOwnProfileSettings(user.id),
    getOwnProfileFields(user.id),
  ]);
  if (!settings) redirect("/login?returnUrl=/account/profile");
  const query = await searchParams;
  const passwordUpdated = query.security === "password-updated";
  const passwordError = query.security === "password-invalid"
    ? "Revisa la contraseña actual y confirma que las nuevas contraseñas coinciden."
    : query.security === "password-error"
      ? "No se pudo actualizar la contraseña."
      : undefined;
  const deleteError = query.security === "delete-invalid"
    ? "Introduce tu contraseña actual y escribe ELIMINAR para confirmar."
    : query.security === "delete-error"
      ? "La contraseña actual no es correcta."
      : undefined;

  return (
    <ClientShell current="profile">
      <section className="profile-panel settings-panel" aria-labelledby="settings-title">
        <p className="eyebrow">Cuenta · Perfil</p>
        <h1 id="settings-title">Tus ajustes</h1>
        <p className="lead">Controla quién puede encontrar tu perfil y qué estado breve quieres mostrar.</p>
        <ProfileSettingsForm profilePrivacy={settings.profilePrivacy} commentsPrivacy={settings.commentsPrivacy} saveProfileViews={settings.saveProfileViews} status={settings.status} username={settings.username} />
      </section>
      <section className="profile-panel settings-panel" aria-labelledby="fields-title">
        <p className="eyebrow">Perfil · Información</p>
        <h2 id="fields-title">Tus campos de perfil</h2>
        <p className="lead">Completa la información que esté configurada para tu cuenta.</p>
        <ProfileFieldsForm fields={fields} />
      </section>
      <section className="profile-panel settings-panel" aria-labelledby="password-title">
        <p className="eyebrow">Cuenta · Seguridad</p>
        <h2 id="password-title">Cambia tu contraseña</h2>
        <p className="lead">Confirma tu contraseña actual para establecer una nueva clave. Las demás sesiones se cerrarán.</p>
        <PasswordChangeForm error={passwordError} message={passwordUpdated ? "Tu contraseña se ha actualizado. Las demás sesiones fueron cerradas." : undefined} />
      </section>
      <section className="profile-panel settings-panel account-danger-zone" aria-labelledby="delete-account-title">
        <p className="eyebrow">Cuenta · Zona peligrosa</p>
        <h2 id="delete-account-title">Eliminar cuenta</h2>
        <p className="lead">Esta acción es irreversible y elimina los datos de cuenta modelados en esta aplicación.</p>
        <DeleteAccountForm error={deleteError} />
      </section>
    </ClientShell>
  );
}
