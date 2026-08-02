import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ClassifiedHeader } from "@/app/components/classifieds/classified-header";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getClassifiedDetail } from "@/server/classifieds/service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ classifiedId: string }>;
}): Promise<Metadata> {
  const { classifiedId } = await params;
  const viewer = await getCurrentUser();
  const classified = await getClassifiedDetail(viewer?.id ?? null, classifiedId);
  return {
    title: classified ? `${classified.title} | Clasificados` : "Clasificado | nexo.",
  };
}

export default async function ClassifiedDetailPage({
  params,
}: {
  params: Promise<{ classifiedId: string }>;
}) {
  const { classifiedId } = await params;
  const viewer = await getCurrentUser();
  const classified = await getClassifiedDetail(viewer?.id ?? null, classifiedId);
  if (!classified) notFound();

  return (
    <ClientShell current="explore">
      <div className="classifieds-module">
        <article className="classifieds-page classifieds-detail-page">
          <ClassifiedHeader classified={classified} />
          <section aria-labelledby="classified-content-title" className="classifieds-detail-content">
            <h2 className="sr-only" id="classified-content-title">
              Contenido del clasificado
            </h2>
            {classified.body ? (
              <div className="classifieds-detail-body">{classified.body}</div>
            ) : (
              <p className="classifieds-detail-description classifieds-detail-description-muted">
                Este clasificado no tiene contenido.
              </p>
            )}
          </section>
        </article>
      </div>
    </ClientShell>
  );
}
