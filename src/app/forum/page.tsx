import type { Metadata } from "next";
import Link from "next/link";

import { getForumCatalog } from "@/server/forum/service";

export const metadata: Metadata = { title: "Foros | Red Social", description: "Consulta las conversaciones públicas de la comunidad." };

export default async function ForumPage() {
  const catalog = await getForumCatalog();
  return <main className="authenticated-shell">
    <header className="app-header"><Link className="brand" href="/">nexo<span>.</span></Link><nav className="profile-navigation" aria-label="Navegación principal"><Link className="text-link" href="/blogs">Blogs</Link><Link className="text-link" href="/articles">Artículos</Link></nav></header>
    <section className="profile-panel forum-panel" aria-labelledby="forums-title">
      <p className="eyebrow">Comunidad · Foros</p><h1 id="forums-title">Conversaciones abiertas</h1><p className="lead">Consulta las instancias de foro y las categorías publicadas por la comunidad.</p>
      {catalog.instances.length > 0 ? <div className="forum-instance-list">{catalog.instances.map((instance) => <Link className="forum-instance-card" href={`/forum/${instance.id}`} key={instance.id}><span className="eyebrow">Foro</span><h2>{instance.name ?? "Foro comunitario"}</h2>{instance.description ? <p>{toExcerpt(instance.description)}</p> : null}<span className="text-link">Ver categorías</span></Link>)}</div> : <p className="empty-state">No hay instancias de foro públicas disponibles.</p>}
    </section>
  </main>;
}

function toExcerpt(value: string): string { const text = value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(); return text.length > 180 ? `${text.slice(0, 177)}...` : text; }
