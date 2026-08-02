import { ClientShell } from "@/components/client/ClientShell";
import { AlbumDetailSkeleton } from "@/app/components/albums/ui/loading-skeleton";

export default function AlbumDetailLoadingPage() {
  return (
    <ClientShell current="explore">
      <div className="albums-module">
        <AlbumDetailSkeleton />
      </div>
    </ClientShell>
  );
}
