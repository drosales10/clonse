import type { Metadata } from "next";

import { normalizeForumQuery } from "@domain/forum";
import { ForumCategoryBar, ForumSubcategoryNav, ForumTopicList, ForumTopicPagination } from "@/app/components/forum/forum-topic-list";
import { ForumInstanceHeader } from "@/app/components/forum/forum-header";
import { ForumEmptyState, ForumUnavailable } from "@/app/components/forum/forum-ui";
import { buildForumInstanceHref } from "@/app/components/forum/utils";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getForumCatalog } from "@/server/forum/service";

export const metadata: Metadata = { title: "Categorías del foro | nexo." };

export default async function ForumInstancePage({
  params,
  searchParams,
}: {
  params: Promise<{ instanceId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { instanceId } = await params;
  const queryParams = await searchParams;
  const categoryId = readString(queryParams.categoryId);
  const page = Number(readString(queryParams.page));
  const viewer = await getCurrentUser();
  const catalog = await getForumCatalog(
    normalizeForumQuery({ instanceId, categoryId, page: Number.isInteger(page) ? page : 1 }),
    viewer?.id ?? null,
  );

  if (!catalog.instance) {
    return (
      <ClientShell current="explore">
        <div className="forum-module">
          <section className="forum-page">
            <ForumUnavailable
              actionHref="/forum"
              actionLabel="Volver a foros"
              description="No encontramos esta instancia o no está publicada."
              title="Foro no disponible"
            />
          </section>
        </div>
      </ClientShell>
    );
  }

  return (
    <ClientShell current="explore">
      <div className="forum-module">
        <section className="forum-page" aria-labelledby="forum-title" id="forum-catalog">
          <ForumInstanceHeader instance={catalog.instance} />
          <ForumCategoryBar
            activeCategoryId={categoryId ?? null}
            categories={catalog.categories}
            instanceId={catalog.instance.id}
          />
          <ForumSubcategoryNav categories={catalog.categories} instanceId={catalog.instance.id} />
          {catalog.topics.length > 0 ? (
            <ForumTopicList instanceId={catalog.instance.id} topics={catalog.topics} />
          ) : (
            <ForumEmptyState
              description="No hay temas públicos con los filtros actuales."
              title="No hay temas para mostrar"
            />
          )}
          <ForumTopicPagination
            hrefForPage={(next) => buildForumInstanceHref(catalog.instance!.id, { categoryId, page: next })}
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
