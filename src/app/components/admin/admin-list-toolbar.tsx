import Link from "next/link";

export function AdminListToolbar({
  newHref,
  newLabel,
  listHref,
  listLabel,
}: {
  newHref: string;
  newLabel: string;
  listHref?: string;
  listLabel?: string;
}) {
  return (
    <div className="admin-list-toolbar">
      {listHref && listLabel ? (
        <Link className="text-link" href={listHref}>
          ← {listLabel}
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
      <Link className="button button-primary button-small" href={newHref}>
        {newLabel}
      </Link>
    </div>
  );
}
