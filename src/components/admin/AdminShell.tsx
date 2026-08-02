import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { adminLogoutAction } from "@/app/actions/admin";
import { ThemeToggle } from "@/components/theme-toggle";
import { getAdminAccessState } from "@/server/admin/access";

const adminNav = [
  { href: "/admin/dashboard", label: "Panel", key: "dashboard" },
  { href: "/admin/users", label: "Usuarios", key: "users" },
  { href: "/admin/polls", label: "Encuestas", key: "polls" },
  { href: "/admin/albums", label: "Álbumes", key: "albums" },
  { href: "/admin/groups", label: "Grupos", key: "groups" },
  { href: "/admin/events", label: "Eventos", key: "events" },
  { href: "/admin/forum", label: "Foro", key: "forum" },
  { href: "/admin/classifieds", label: "Clasificados", key: "classifieds" },
  { href: "/admin/blogs", label: "Blogs", key: "blogs" },
  { href: "/admin/businesses", label: "Negocios", key: "businesses" },
  { href: "/admin/articles", label: "Artículos", key: "articles" },
  { href: "/admin/levels", label: "Niveles", key: "levels" },
  { href: "/admin/subnetworks", label: "Subredes", key: "subnetworks" },
  { href: "/admin/settings", label: "Configuración", key: "settings" },
  { href: "/admin/language-variables", label: "Idioma", key: "language" },
] as const;

export async function AdminShell({
  children,
  current,
  title,
}: {
  children: ReactNode;
  current: (typeof adminNav)[number]["key"];
  title?: string;
}) {
  const access = await getAdminAccessState();
  if (!access.admin) redirect("/admin/login");

  const pageTitle = title ?? adminNav.find((item) => item.key === current)?.label ?? "Admin";

  return (
    <div className="admin-app">
      <aside className="admin-sidebar" aria-label="Consola administrativa">
        <Link className="brand brand-mark admin-brand" href="/admin/dashboard">
          nexo<span>.</span>
          <small>ops</small>
        </Link>
        <p className="admin-sidebar-label">Consola</p>
        <nav className="admin-side-nav">
          {adminNav.map((item) => (
            <Link
              aria-current={current === item.key ? "page" : undefined}
              className="admin-side-link"
              href={item.href}
              key={item.key}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <p>
            <strong>{access.admin.displayName}</strong>
            <small>@{access.admin.username}</small>
          </p>
          <form action={adminLogoutAction}>
            <button className="button button-quiet" type="submit">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <div className="admin-workspace">
        <header className="admin-workspace-bar">
          <div>
            <p className="eyebrow">Administración</p>
            <h1 className="admin-page-title">{pageTitle}</h1>
          </div>
          <div className="admin-workspace-actions">
            <ThemeToggle />
            <Link className="text-link" href="/">
              Ver sitio
            </Link>
          </div>
        </header>
        <div className="admin-workspace-body">{children}</div>
      </div>
    </div>
  );
}
