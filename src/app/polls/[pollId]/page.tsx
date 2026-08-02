import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PollHeader, PollResults } from "@/app/components/polls/poll-header";
import { PollVotePanel } from "@/app/components/polls/poll-vote-panel";
import { ClientShell } from "@/components/client/ClientShell";
import { getCurrentUser } from "@/server/auth/session";
import { getPollDetail } from "@/server/polls/service";

export async function generateMetadata({ params }: { params: Promise<{ pollId: string }> }): Promise<Metadata> {
  const { pollId } = await params;
  const viewer = await getCurrentUser();
  const poll = await getPollDetail(viewer?.id ?? null, pollId);
  return { title: poll ? `${poll.title} | Encuestas` : "Encuesta | nexo." };
}

export default async function PollDetailPage({ params }: { params: Promise<{ pollId: string }> }) {
  const { pollId } = await params;
  const viewer = await getCurrentUser();
  const poll = await getPollDetail(viewer?.id ?? null, pollId);
  if (!poll) notFound();

  return (
    <ClientShell current="explore">
      <div className="polls-module">
        <article className="polls-page polls-detail-page">
          <PollHeader poll={poll} />
          <PollResults poll={poll} />
          <PollVotePanel poll={poll} />
        </article>
      </div>
    </ClientShell>
  );
}
