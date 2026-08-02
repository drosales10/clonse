export function AlbumCatalogSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando álbumes" className="albums-skeleton-catalog">
      <div className="albums-skeleton-header">
        <div className="albums-skeleton-line albums-skeleton-line-sm" />
        <div className="albums-skeleton-line albums-skeleton-line-lg" />
        <div className="albums-skeleton-line albums-skeleton-line-md" />
      </div>
      <div className="albums-skeleton-toolbar">
        <div className="albums-skeleton-pill" />
        <div className="albums-skeleton-pill" />
        <div className="albums-skeleton-pill albums-skeleton-pill-wide" />
      </div>
      <div className="albums-skeleton-grid">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="albums-skeleton-card" key={index}>
            <div className="albums-skeleton-cover" />
            <div className="albums-skeleton-line albums-skeleton-line-md" />
            <div className="albums-skeleton-line albums-skeleton-line-sm" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AlbumDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando álbum" className="albums-skeleton-detail">
      <div className="albums-skeleton-line albums-skeleton-line-sm" />
      <div className="albums-skeleton-line albums-skeleton-line-lg" />
      <div className="albums-skeleton-line albums-skeleton-line-md" />
      <div className="albums-skeleton-facts">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="albums-skeleton-pill" key={index} />
        ))}
      </div>
      <div className="albums-skeleton-gallery">
        {Array.from({ length: 8 }).map((_, index) => (
          <div className="albums-skeleton-thumb" key={index} />
        ))}
      </div>
    </div>
  );
}
