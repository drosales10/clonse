import Link from "next/link";

export default function HomePage() {
  return (
    <main className="landing-shell">
      <nav className="topbar" aria-label="Navegación principal">
        <Link className="brand" href="/">nexo<span>.</span></Link>
        <div className="topbar-actions">
          <Link className="text-link" href="/login">Iniciar sesión</Link>
          <Link className="button button-small" href="/signup">Crear cuenta</Link>
        </div>
      </nav>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">Una red que crece contigo</p>
          <h1 id="hero-title">Conecta. Comparte. <em>Pertenece.</em></h1>
          <p className="lead">El gemelo digital de tu red social, construido paso a paso con privacidad, accesibilidad y una base sólida.</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/signup">Empezar ahora</Link>
            <Link className="text-link" href="/login">Ya tengo una cuenta <span aria-hidden="true">→</span></Link>
          </div>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <div className="orbit orbit-one"><span className="avatar avatar-one">A</span></div>
          <div className="orbit orbit-two"><span className="avatar avatar-two">M</span></div>
          <div className="orbit orbit-three"><span className="avatar avatar-three">R</span></div>
          <div className="orbit-core">nexo<span>.</span></div>
        </div>
      </section>
      <section className="feature-strip" aria-label="Capacidades previstas">
        <div><span>01</span><h2>Tu espacio</h2><p>Perfil y actividad con privacidad como regla.</p></div>
        <div><span>02</span><h2>Tu gente</h2><p>Amistades, comunidades y conversaciones.</p></div>
        <div><span>03</span><h2>Tu historia</h2><p>Publica, descubre y vuelve a conectar.</p></div>
      </section>
    </main>
  );
}
