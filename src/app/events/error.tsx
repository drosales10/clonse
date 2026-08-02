"use client";

export default function EventsErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="events-module">
      <section className="events-page">
        <div className="events-empty" role="alert">
          <h2>No pudimos cargar los eventos</h2>
          <p>Inténtalo de nuevo en unos segundos.</p>
          <button className="events-btn events-btn-primary" onClick={reset} type="button">
            Reintentar
          </button>
        </div>
      </section>
    </div>
  );
}
