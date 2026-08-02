import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";

export default function HomePage() {
  return (
    <main className="landing-shell">
      <nav className="topbar" aria-label="Navegación principal">
        <Link className="brand brand-mark" href="/">
          nexo<span>.</span>
        </Link>
        <div className="topbar-actions">
          <ThemeToggle />
          <Link className="text-link" href="/login">
            Iniciar sesión
          </Link>
          <Link className="button button-small" href="/signup">
            Crear cuenta
          </Link>
        </div>
      </nav>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">Tu red, en movimiento</p>
          <h1 id="hero-title">
            nexo<span>.</span>
          </h1>
          <p className="lead">
            Conecta con tu gente, comparte lo que importa y explora comunidades en un espacio pensado
            para pertenecer.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/signup">
              Empezar ahora
            </Link>
            <Link className="text-link" href="/login">
              Ya tengo una cuenta <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <div className="orbit orbit-one">
            <span className="avatar avatar-one">A</span>
          </div>
          <div className="orbit orbit-two">
            <span className="avatar avatar-two">M</span>
          </div>
          <div className="orbit orbit-three">
            <span className="avatar avatar-three">R</span>
          </div>
          <div className="orbit-core">
            nexo<span>.</span>
          </div>
        </div>
      </section>
      <section className="feature-strip" aria-label="Capacidades">
        <div>
          <span>01</span>
          <h2>Tu espacio</h2>
          <p>Perfil, privacidad y actividad bajo tu control.</p>
        </div>
        <div>
          <span>02</span>
          <h2>Tu gente</h2>
          <p>Amistades, grupos y conversaciones cercanas.</p>
        </div>
        <div>
          <span>03</span>
          <h2>Tu mapa</h2>
          <p>Foros, eventos, blogs y directorios para descubrir.</p>
        </div>
      </section>
    </main>
  );
}
