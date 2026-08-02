import { ClientShell } from "@/components/client/ClientShell";
import { ForumCatalogSkeleton } from "@/app/components/forum/forum-ui";

export default function ForumInstanceLoadingPage() {
  return (
    <ClientShell current="explore">
      <div className="forum-module">
        <section className="forum-page">
          <ForumCatalogSkeleton />
        </section>
      </div>
    </ClientShell>
  );
}
