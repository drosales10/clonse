"use client";

export default function ForumErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="forum-module">
      <section className="forum-page">
        <div className="forum-empty" role="alert">
          <h2>No pudimos cargar el foro</h2>
          <p>Inténtalo de nuevo en unos segundos.</p>
          <button className="forum-btn forum-btn-primary" onClick={reset} type="button">
            Reintentar
          </button>
        </div>
      </section>
    </div>
  );
}
