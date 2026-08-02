import type { Metadata } from "next";

import { ForumInstanceGrid } from "@/app/components/forum/forum-instance-grid";
import { ForumBreadcrumb, ForumEmptyState } from "@/app/components/forum/forum-ui";
import { ClientShell } from "@/components/client/ClientShell";
import { getForumCatalog } from "@/server/forum/service";

export const metadata: Metadata = {
  title: "Foros | nexo.",
  description: "Consulta las conversaciones públicas de la comunidad.",
};

export default async function ForumPage() {
  const catalog = await getForumCatalog();

  return (
    <ClientShell current="explore">
      <div className="forum-module">
        <section className="forum-page" aria-labelledby="forums-title" id="forum-catalog">
          <header className="forum-page-header">
            <ForumBreadcrumb
              items={[
                { label: "Inicio", href: "/home" },
                { label: "Foros" },
              ]}
            />
            <div className="forum-page-heading">
              <div>
                <p className="forum-page-eyebrow">Comunidad · Foros</p>
                <h1 id="forums-title">Conversaciones abiertas</h1>
                <p className="forum-page-lead">
                  Consulta las instancias de foro y las categorías publicadas por la comunidad.
                </p>
              </div>
            </div>
          </header>
          {catalog.instances.length > 0 ? (
            <ForumInstanceGrid instances={catalog.instances} />
          ) : (
            <ForumEmptyState
              description="Aún no hay instancias de foro visibles para visitantes."
              title="No hay foros disponibles"
            />
          )}
        </section>
      </div>
    </ClientShell>
  );
}
