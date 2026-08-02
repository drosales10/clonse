import { ClientShell } from "@/components/client/ClientShell";
import { ArticleCatalogSkeleton } from "@/app/components/articles/article-ui";

export default function ArticlesLoadingPage() {
  return (
    <ClientShell current="explore">
      <div className="articles-module">
        <ArticleCatalogSkeleton />
      </div>
    </ClientShell>
  );
}
