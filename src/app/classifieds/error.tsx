"use client";

export default function ClassifiedsErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="classifieds-module">
      <section className="classifieds-page">
        <div className="classifieds-empty" role="alert">
          <h2>No pudimos cargar los clasificados</h2>
          <p>Inténtalo de nuevo en unos segundos.</p>
          <button className="classifieds-btn classifieds-btn-primary" onClick={reset} type="button">
            Reintentar
          </button>
        </div>
      </section>
    </div>
  );
}
