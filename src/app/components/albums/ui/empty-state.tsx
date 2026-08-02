import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="albums-empty" role="status">
      {icon ? <div className="albums-empty-icon" aria-hidden="true">{icon}</div> : null}
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {action ? <div className="albums-empty-action">{action}</div> : null}
    </div>
  );
}
