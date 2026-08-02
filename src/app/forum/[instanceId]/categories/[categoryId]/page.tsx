import type { Metadata } from "next";
import Link from "next/link";

import { normalizeForumQuery } from "@domain/forum";
import { ForumCategoryHeader } from "@/app/components/forum/forum-header";
import { ForumTopicList, ForumTopicPagination } from "@/app/components/forum/forum-topic-list";
import { ForumEmptyState, ForumUnavailable } from "@/app/components/forum/forum-ui";
import { buildForumCategoryHref, matchesPublicIdentifier } from "@/app/components/forum/utils";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getForumCatalog } from "@/server/forum/service";

export const metadata: Metadata = { title: "Categoría del foro | nexo." };

export default async function ForumCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ instanceId: string; categoryId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { instanceId, categoryId } = await params;
  const query = await searchParams;
  const page = Number(readString(query.page));
  const viewer = await getCurrentUser();
  const catalog = await getForumCatalog(
    normalizeForumQuery({
      instanceId,
      categoryId,
      page: Number.isInteger(page) ? page : 1,
    }),
    viewer?.id ?? null,
  );
  const category = catalog.categories.find((item) => matchesPublicIdentifier(item.id, item.legacyId, categoryId));
  const parent = category?.parentId ? catalog.categories.find((item) => item.id === category.parentId) : null;

  if (!catalog.instance || !category || !parent || category.parentId === null) {
    return (
      <ClientShell current="explore">
        <div className="forum-module">
          <section className="forum-page">
            <ForumUnavailable
              actionHref={`/forum/${encodeURIComponent(instanceId)}`}
              actionLabel="Volver al foro"
              description="No encontramos esta categoría o no está publicada para visitantes."
              title="Categoría no disponible"
            />
          </section>
        </div>
      </ClientShell>
    );
  }

  const canCreate = Boolean(viewer && !category.isLocked);

  return (
    <ClientShell current="explore">
      <div className="forum-module">
        <section className="forum-page" aria-labelledby="category-title" id="forum-catalog">
          <ForumCategoryHeader
            canCreate={canCreate}
            category={category}
            instanceId={instanceId}
            instanceName={catalog.instance.name}
            parentTitle={parent.title}
          />
          {catalog.topics.length > 0 ? (
            <ForumTopicList categoryIdForLink={category.id} instanceId={instanceId} topics={catalog.topics} />
          ) : (
            <ForumEmptyState
              action={
                canCreate ? (
                  <Link
                    className="forum-btn forum-btn-primary"
                    href={`/forum/${encodeURIComponent(instanceId)}/categories/${encodeURIComponent(category.id)}/new`}
                  >
                    Crear el primer tema
                  </Link>
                ) : undefined
              }
              description="Sé el primero en iniciar una conversación en esta categoría."
              title="No hay temas en esta categoría"
            />
          )}
          <ForumTopicPagination
            hrefForPage={(next) => buildForumCategoryHref(instanceId, category.id, next)}
            page={catalog.pagination.page}
            pageCount={catalog.pagination.pageCount}
          />
        </section>
      </div>
    </ClientShell>
  );
}

function readString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
