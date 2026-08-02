import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentUser } from "@/server/auth/session";
import { getBlogEntryDetail } from "@/server/blogs/service";
import { ClientShell } from "@/components/client/ClientShell";

export const metadata: Metadata = {
  title: "Entrada de blog | Red Social",
  description: "Consulta una entrada de blog visible de la comunidad.",
};

export default async function BlogEntryDetailPage({ params }: { params: Promise<{ entryId: string }> }) {
  const { entryId } = await params;
  const viewer = await getCurrentUser();
  const entry = await getBlogEntryDetail(viewer?.id ?? null, entryId);
  if (!entry) notFound();

  return <ClientShell current="explore">
    <article className="profile-panel blog-detail-panel" aria-labelledby="blog-entry-title">
      <Link className="text-link blog-back-link" href="/blogs">← Volver a blogs</Link>
      <p className="eyebrow">{entry.category?.title ?? "Blog"}</p>
      <h1 id="blog-entry-title">{entry.title}</h1>
      <dl className="blog-detail-facts"><div><dt>Autor</dt><dd><Link href={`/profile/${encodeURIComponent(entry.author.username)}`}>{entry.author.displayName}</Link></dd></div><div><dt>Publicado</dt><dd><time dateTime={entry.createdAt.toISOString()}>{formatDate(entry.createdAt)}</time></dd></div><div><dt>Visitas</dt><dd>{entry.views}</dd></div></dl>
      <div className="blog-detail-body">{entry.body ? <p>{entry.body}</p> : <p className="empty-state">Esta entrada no tiene contenido visible.</p>}</div>
      <p className="blog-detail-note">El contenido se muestra como texto seguro; comentarios, trackbacks, suscripciones y estilos legacy no forman parte de esta lectura.</p>
    </article>
  </ClientShell>;
}

function formatDate(value: Date): string { return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(value); }
