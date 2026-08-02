import Link from "next/link";

import type { PublicForumInstance } from "@domain/forum";

import { toExcerpt } from "@/app/components/forum/utils";

export function ForumInstanceGrid({ instances }: { instances: PublicForumInstance[] }) {
  return (
    <div className="forum-instance-grid">
      {instances.map((instance) => (
        <Link className="forum-instance-card" href={`/forum/${encodeURIComponent(instance.id)}`} key={instance.id}>
          <span className="forum-card-eyebrow">Foro</span>
          <h2>{instance.name ?? "Foro comunitario"}</h2>
          {instance.description ? <p>{toExcerpt(instance.description)}</p> : null}
          <span className="forum-text-link">Ver categorías →</span>
        </Link>
      ))}
    </div>
  );
}
