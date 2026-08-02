import { ClientShell } from "@/components/client/ClientShell";
import { AlbumCatalogSkeleton } from "@/app/components/albums/ui/loading-skeleton";

export default function AlbumsLoadingPage() {
  return (
    <ClientShell current="explore">
      <div className="albums-module">
        <AlbumCatalogSkeleton />
      </div>
    </ClientShell>
  );
}
