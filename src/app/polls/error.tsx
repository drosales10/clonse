"use client";

export default function PollsErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="polls-module">
      <section className="polls-page">
        <div className="polls-empty" role="alert">
          <h2>No pudimos cargar las encuestas</h2>
          <p>Inténtalo de nuevo en unos segundos.</p>
          <button className="polls-btn polls-btn-primary" onClick={reset} type="button">Reintentar</button>
        </div>
      </section>
    </div>
  );
}
