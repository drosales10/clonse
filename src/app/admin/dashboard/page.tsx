import Link from "next/link";

import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminDashboardStats } from "@/server/admin/dashboard";

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  return (
    <AdminShell current="dashboard" title="Panel">
      <section className="welcome-panel" aria-labelledby="admin-dashboard-lead">
        <p className="lead" id="admin-dashboard-lead">
          Métricas disponibles con modelos destino verificados. El resto de indicadores legacy queda
          pendiente de contrato.
        </p>
        <div className="admin-stat-grid">
          <article>
            <span>01</span>
            <h2>{stats.totalUsers}</h2>
            <p>Usuarios registrados</p>
          </article>
          <article>
            <span>02</span>
            <h2>{stats.enabledUsers}</h2>
            <p>Usuarios habilitados</p>
          </article>
          <article>
            <span>03</span>
            <h2>{stats.verifiedUsers}</h2>
            <p>Email verificado</p>
          </article>
          <article>
            <span>04</span>
            <h2>{stats.totalLevels}</h2>
            <p>
              <Link className="text-link" href="/admin/levels">
                Niveles
              </Link>
            </p>
          </article>
          <article>
            <span>05</span>
            <h2>{stats.totalSubnetworks}</h2>
            <p>
              <Link className="text-link" href="/admin/subnetworks">
                Subredes
              </Link>
            </p>
          </article>
          <article>
            <span>06</span>
            <h2>{stats.totalSettings}</h2>
            <p>
              <Link className="text-link" href="/admin/settings">
                Configuración
              </Link>
            </p>
          </article>
          <article>
            <span>07</span>
            <h2>{stats.totalLanguageVariables}</h2>
            <p>
              <Link className="text-link" href="/admin/language-variables">
                Variables de idioma
              </Link>
            </p>
          </article>
        </div>
        <p className="empty-state">
          Mensajes, reportes, amistades, anuncios, logins y estadísticas legacy requieren contratos
          destino adicionales.
        </p>
      </section>
    </AdminShell>
  );
}
