import Link from "next/link";

export function PermissionNotice({
  message = "Inicia sesión para crear y gestionar tus álbumes.",
  loginHref = "/login?returnUrl=/albums",
}: {
  message?: string;
  loginHref?: string;
}) {
  return (
    <aside className="albums-permission-notice" role="note">
      <p>{message}</p>
      <Link className="albums-text-link" href={loginHref}>
        Iniciar sesión
      </Link>
    </aside>
  );
}
