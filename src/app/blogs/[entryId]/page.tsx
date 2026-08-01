import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentUser } from "@/server/auth/session";
import { getBlogEntryDetail } from "@/server/blogs/service";

export const metadata: Metadata = {
  title: "Entrada de blog | Red Social",
  description: "Consulta una entrada de blog visible de la comunidad.",
};

export default async function BlogEntryDetailPage({ params }: { params: Promise<{ entryId: string }> }) {
  const { entryId } = await params;
  const viewer = await getCurrentUser();
  const entry = await getBlogEntryDetail(viewer?.id ?? null, entryId);
  if (!entry) notFound();

  return <main className="authenticated-shell">
    <header className="app-header"><Link className="brand" href="/">nexo<span>.</span></Link><nav className="profile-navigation" aria-label="Navegación principal"><Link className="text-link" href="/blogs">Blogs</Link>{viewer ? <Link className="text-link" href={`/profile/${encodeURIComponent(viewer.username)}`}>Mi perfil</Link> : <Link className="text-link" href="/login">Iniciar sesión</Link>}</nav></header>
    <article className="profile-panel blog-detail-panel" aria-labelledby="blog-entry-title">
      <Link className="text-link blog-back-link" href="/blogs">← Volver a blogs</Link>
      <p className="eyebrow">{entry.category?.title ?? "Blog"}</p>
      <h1 id="blog-entry-title">{entry.title}</h1>
      <dl className="blog-detail-facts"><div><dt>Autor</dt><dd><Link href={`/profile/${encodeURIComponent(entry.author.username)}`}>{entry.author.displayName}</Link></dd></div><div><dt>Publicado</dt><dd><time dateTime={entry.createdAt.toISOString()}>{formatDate(entry.createdAt)}</time></dd></div><div><dt>Visitas</dt><dd>{entry.views}</dd></div></dl>
      <div className="blog-detail-body">{entry.body ? <p>{entry.body}</p> : <p className="empty-state">Esta entrada no tiene contenido visible.</p>}</div>
      <p className="blog-detail-note">El contenido se muestra como texto seguro; comentarios, trackbacks, suscripciones y estilos legacy no forman parte de esta lectura.</p>
    </article>
  </main>;
}

function formatDate(value: Date): string { return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(value); }
