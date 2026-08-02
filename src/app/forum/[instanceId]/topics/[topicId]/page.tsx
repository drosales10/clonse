import type { Metadata } from "next";

import { normalizeForumQuery } from "@domain/forum";
import { ForumPostList, ForumTopicHeader } from "@/app/components/forum/forum-header";
import { ForumReplyPanel } from "@/app/components/forum/forum-reply-panel";
import { ForumTopicPagination } from "@/app/components/forum/forum-topic-list";
import { ForumUnavailable } from "@/app/components/forum/forum-ui";
import { buildForumTopicHref } from "@/app/components/forum/utils";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getForumTopic } from "@/server/forum/service";

export const metadata: Metadata = { title: "Tema del foro | nexo." };

export default async function ForumTopicPage({
  params,
  searchParams,
}: {
  params: Promise<{ instanceId: string; topicId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { instanceId, topicId } = await params;
  const query = await searchParams;
  const categoryId = readString(query.categoryId);
  const page = Number(readString(query.page));
  const viewer = await getCurrentUser();
  const result = categoryId
    ? await getForumTopic(
        normalizeForumQuery({ instanceId, categoryId, topicId, page: Number.isInteger(page) ? page : 1 }),
        viewer?.id ?? null,
      )
    : null;

  if (!result) {
    return (
      <ClientShell current="explore">
        <div className="forum-module">
          <section className="forum-page">
            <ForumUnavailable
              actionHref={`/forum/${encodeURIComponent(instanceId)}`}
              actionLabel="Volver al foro"
              description="No encontramos este tema o no está publicado para visitantes."
              title="Tema no disponible"
            />
          </section>
        </div>
      </ClientShell>
    );
  }

  const canReply = Boolean(viewer && !result.category.isLocked && !result.topic.isLocked);

  return (
    <ClientShell current="explore">
      <div className="forum-module">
        <section className="forum-page" aria-labelledby="forum-topic">
          <ForumTopicHeader
            category={result.category}
            instance={result.instance}
            parentTitle={null}
            topic={result.topic}
          />
          {(result.topic.isLocked || result.category.isLocked) ? (
            <p className="forum-inline-notice" role="status">
              {result.topic.isLocked
                ? "Este tema está bloqueado. No se aceptan nuevas respuestas."
                : "Esta categoría está bloqueada. No se aceptan nuevas respuestas."}
            </p>
          ) : null}
          <ForumPostList posts={result.posts} />
          {canReply ? (
            <ForumReplyPanel
              categoryId={result.category.id}
              instanceId={result.instance.id}
              topicId={result.topic.id}
            />
          ) : null}
          <ForumTopicPagination
            hrefForPage={(next) => buildForumTopicHref(instanceId, topicId, result.category.id, next)}
            page={result.pagination.page}
            pageCount={result.pagination.pageCount}
          />
        </section>
      </div>
    </ClientShell>
  );
}

function readString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
