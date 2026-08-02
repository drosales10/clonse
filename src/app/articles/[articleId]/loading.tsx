import { ClientShell } from "@/components/client/ClientShell";
import { ArticleDetailSkeleton } from "@/app/components/articles/article-ui";

export default function ArticleDetailLoadingPage() {
  return (
    <ClientShell current="explore">
      <div className="articles-module">
        <ArticleDetailSkeleton />
      </div>
    </ClientShell>
  );
}
