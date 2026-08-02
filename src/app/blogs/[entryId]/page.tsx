import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlogHeader } from "@/app/components/blogs/blog-header";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getBlogEntryDetail } from "@/server/blogs/service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ entryId: string }>;
}): Promise<Metadata> {
  const { entryId } = await params;
  const viewer = await getCurrentUser();
  const entry = await getBlogEntryDetail(viewer?.id ?? null, entryId);
  return { title: entry ? `${entry.title} | Blogs` : "Entrada de blog | nexo." };
}

export default async function BlogEntryDetailPage({ params }: { params: Promise<{ entryId: string }> }) {
  const { entryId } = await params;
  const viewer = await getCurrentUser();
  const entry = await getBlogEntryDetail(viewer?.id ?? null, entryId);
  if (!entry) notFound();

  return (
    <ClientShell current="explore">
      <div className="blogs-module">
        <article className="blogs-page blogs-detail-page" aria-labelledby="blog-entry-title">
          <BlogHeader entry={entry} />
          <section aria-labelledby="blog-entry-body-title" className="blogs-detail-body-section">
            <h2 className="sr-only" id="blog-entry-body-title">
              Contenido
            </h2>
            <div className="blogs-detail-body">
              {entry.body ? <p>{entry.body}</p> : <p className="blogs-detail-body-empty">Esta entrada no tiene contenido visible.</p>}
            </div>
          </section>
          <p className="blogs-detail-note">
            El contenido se muestra como texto seguro; comentarios, trackbacks, suscripciones y estilos legacy no
            forman parte de esta lectura.
          </p>
        </article>
      </div>
    </ClientShell>
  );
}
