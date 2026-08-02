"use client";

export default function BlogsErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="blogs-module">
      <section className="blogs-page">
        <div className="blogs-empty" role="alert">
          <h2>No pudimos cargar los blogs</h2>
          <p>Inténtalo de nuevo en unos segundos.</p>
          <button className="blogs-btn blogs-btn-primary" onClick={reset} type="button">
            Reintentar
          </button>
        </div>
      </section>
    </div>
  );
}
