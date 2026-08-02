"use client";

import { ErrorState } from "@/app/components/albums/ui/error-state";

export default function AlbumsErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="albums-module">
      <section className="albums-page">
        <ErrorState onRetry={reset} />
      </section>
    </div>
  );
}
