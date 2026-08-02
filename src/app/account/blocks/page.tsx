import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ProfileBlockActions } from "@/app/components/profile-block-actions";
import { getBlockedUsers } from "@/server/profile/service";
import { getCurrentUser } from "@/server/auth/session";
import { ClientShell } from "@/components/client/ClientShell";

export const metadata: Metadata = {
  title: "Bloqueos | Red Social",
  description: "Gestiona los perfiles bloqueados por tu cuenta.",
};

export default async function BlocksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnUrl=/account/blocks");

  const blockedUsers = await getBlockedUsers(user.id);

  return (
    <ClientShell current="friends">
      <section className="profile-panel friends-panel" aria-labelledby="blocks-title">
        <p className="eyebrow">Cuenta · Privacidad</p>
        <h1 id="blocks-title">Perfiles bloqueados</h1>
        <p className="lead">Los perfiles de esta lista no pueden interactuar contigo mientras permanezcan bloqueados.</p>
        {blockedUsers.length > 0 ? (
          <div className="friends-list blocks-list">
            {blockedUsers.map((blockedUser) => (
              <article className="friend-card" key={blockedUser.username}>
                <Link className="friend-card-identity" href={`/profile/${encodeURIComponent(blockedUser.username)}`}>
                  <span className="friend-avatar" aria-hidden="true">{blockedUser.displayName.slice(0, 1).toUpperCase()}</span>
                  <span><strong>{blockedUser.displayName}</strong><small>@{blockedUser.username}</small></span>
                </Link>
                <ProfileBlockActions blockedByViewer username={blockedUser.username} />
              </article>
            ))}
          </div>
        ) : <p className="empty-state">No has bloqueado ningún perfil.</p>}
      </section>
    </ClientShell>
  );
}
