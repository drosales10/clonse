"use client";

export default function ArticlesErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="articles-module">
      <section className="articles-page">
        <div className="articles-empty" role="alert">
          <h2>No pudimos cargar los artículos</h2>
          <p>Inténtalo de nuevo en unos segundos.</p>
          <button className="articles-btn articles-btn-primary" onClick={reset} type="button">
            Reintentar
          </button>
        </div>
      </section>
    </div>
  );
}
