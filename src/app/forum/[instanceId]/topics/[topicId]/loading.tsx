import { ClientShell } from "@/components/client/ClientShell";
import { ForumTopicSkeleton } from "@/app/components/forum/forum-ui";

export default function ForumTopicLoadingPage() {
  return (
    <ClientShell current="explore">
      <div className="forum-module">
        <section className="forum-page">
          <ForumTopicSkeleton />
        </section>
      </div>
    </ClientShell>
  );
}
