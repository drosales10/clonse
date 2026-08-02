import Link from "next/link";
import type { ReactNode } from "react";

import { logoutAction } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentUser } from "@/server/auth/session";

const primaryNav = [
  { href: "/home", label: "Inicio", key: "home" },
  { href: "/people", label: "Personas", key: "people" },
  { href: "/account/friends", label: "Red", key: "friends" },
  { href: "/account/notifications", label: "Avisos", key: "notifications" },
] as const;

const exploreNav = [
  { href: "/forum", label: "Foros" },
  { href: "/groups", label: "Grupos" },
  { href: "/events", label: "Eventos" },
  { href: "/albums", label: "Álbumes" },
  { href: "/polls", label: "Encuestas" },
  { href: "/blogs", label: "Blogs" },
  { href: "/articles", label: "Artículos" },
  { href: "/businesses", label: "Negocios" },
  { href: "/classifieds", label: "Clasificados" },
] as const;

export async function ClientShell({
  children,
  current,
}: {
  children: ReactNode;
  current?: string;
}) {
  const user = await getCurrentUser();
  const profileHref = user ? `/profile/${encodeURIComponent(user.username)}` : "/login";

  return (
    <div className="client-surface">
      <header className="client-topbar">
        <div className="client-topbar-inner">
          <Link className="brand brand-mark" href={user ? "/home" : "/"}>
            nexo<span>.</span>
          </Link>
          <nav className="client-nav" aria-label="Navegación principal">
            {primaryNav.map((item) => (
              <Link
                aria-current={current === item.key ? "page" : undefined}
                className="client-nav-link"
                href={item.href}
                key={item.key}
              >
                {item.label}
              </Link>
            ))}
            <details className="client-nav-more">
              <summary>Explorar</summary>
              <div className="client-nav-menu" role="menu">
                {exploreNav.map((item) => (
                  <Link href={item.href} key={item.href} role="menuitem">
                    {item.label}
                  </Link>
                ))}
              </div>
            </details>
          </nav>
          <div className="client-topbar-actions">
            <ThemeToggle />
            {user ? (
              <>
                <Link className="client-nav-link" href={profileHref}>
                  {user.displayName}
                </Link>
                <Link className="client-nav-link" href="/account/profile">
                  Ajustes
                </Link>
                <form action={logoutAction}>
                  <button className="button button-quiet" type="submit">
                    Salir
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link className="text-link" href="/login">
                  Entrar
                </Link>
                <Link className="button button-small" href="/signup">
                  Unirme
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="client-main">{children}</main>

      <nav className="client-dock" aria-label="Accesos rápidos">
        <Link aria-current={current === "home" ? "page" : undefined} href="/home">
          Inicio
        </Link>
        <Link aria-current={current === "people" ? "page" : undefined} href="/people">
          Personas
        </Link>
        <Link aria-current={current === "explore" ? "page" : undefined} href="/groups">
          Explorar
        </Link>
        <Link
          aria-current={current === "notifications" ? "page" : undefined}
          href="/account/notifications"
        >
          Avisos
        </Link>
        <Link aria-current={current === "profile" ? "page" : undefined} href={profileHref}>
          Perfil
        </Link>
      </nav>
    </div>
  );
}
