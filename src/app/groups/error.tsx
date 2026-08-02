"use client";

export default function GroupsErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="groups-module">
      <section className="groups-page">
        <div className="groups-empty" role="alert">
          <h2>No pudimos cargar los grupos</h2>
          <p>Inténtalo de nuevo en unos segundos.</p>
          <button className="groups-btn groups-btn-primary" onClick={reset} type="button">
            Reintentar
          </button>
        </div>
      </section>
    </div>
  );
}
