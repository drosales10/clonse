import Link from "next/link";
import { redirect } from "next/navigation";

import { logoutAction } from "@/app/actions/auth";
import { getCurrentUser } from "@/server/auth/session";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnUrl=/home");

  const params = await searchParams;
  return (
    <main className="authenticated-shell">
      <header className="app-header">
        <Link className="brand" href="/">nexo<span>.</span></Link>
        <form action={logoutAction}>
          <button className="button button-quiet" type="submit">Cerrar sesión</button>
        </form>
      </header>
      <section className="welcome-panel" aria-labelledby="welcome-title">
        <p className="eyebrow">Inicio autenticado</p>
        <h1 id="welcome-title">Hola, {user.displayName}</h1>
        <p className="lead">Tu sesión está activa como <strong>{user.email}</strong>.</p>
        {params.welcome === "1" ? <p className="success-message" role="status">Cuenta creada. El siguiente incremento añadirá verificación por email.</p> : null}
        <div className="scope-grid">
          <article><span>01</span><h2>Actividad</h2><p>Feed, estados y comentarios se incorporarán después de cerrar la identidad.</p></article>
          <article><span>02</span><h2>Perfil</h2><p>Privacidad, campos dinámicos y foto requieren el inventario de settings y niveles.</p></article>
          <article><span>03</span><h2>Mensajes</h2><p>La comunicación usará la sesión server-side sin exponer datos privados al cliente.</p></article>
        </div>
      </section>
    </main>
  );
}
