"use client";

export function ErrorState({
  title = "No pudimos cargar los álbumes",
  description = "Ocurrió un problema al obtener los datos. Puedes reintentar en unos segundos.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="albums-error" role="alert">
      <h2>{title}</h2>
      <p>{description}</p>
      {onRetry ? (
        <button className="albums-btn albums-btn-primary" onClick={onRetry} type="button">
          Reintentar
        </button>
      ) : null}
    </div>
  );
}
