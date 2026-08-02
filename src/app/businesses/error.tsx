"use client";

export default function BusinessesErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="businesses-module">
      <section className="businesses-page">
        <div className="businesses-empty" role="alert">
          <h2>No pudimos cargar los negocios</h2>
          <p>Inténtalo de nuevo en unos segundos.</p>
          <button className="businesses-btn businesses-btn-primary" onClick={reset} type="button">
            Reintentar
          </button>
        </div>
      </section>
    </div>
  );
}
