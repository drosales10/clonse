## Estado

Inventario y contrato inicial del área administrativa. Se confirma la frontera administrativa legacy, pero el gemelo Next.js todavía no tiene una autoridad administrativa verificable ni modelos destino para administradores, niveles, subredes o configuración global. Por ello, este incremento define el alcance y las invariantes sin habilitar acceso administrativo ficticio ni reutilizar la sesión de usuario como autorización.

No se modifican PHP/MySQL ni `docs/legacy`. No se ejecutan imports, migraciones, backfills ni operaciones destructivas.

## Evidencia legacy

- `docs/legacy/admin/index.php` redirige a `admin_login.php`.
- `docs/legacy/admin/admin_login.php` procesa `task=dologin`, delega la validación en `SEAdmin::admin_login()` y redirige a `admin_home.php` cuando no hay error.
- `docs/legacy/admin/admin_header.php` inicializa sesión, `SEAdmin`, idioma y configuración; todas las páginas administrativas, salvo login y recuperación, redirigen a `admin_login.php` si `admin_exists` es falso.
- `docs/legacy/include/class_admin.php` obtiene administradores desde `se_admins`, comprueba `admin_enabled` y mantiene una sesión administrativa separada mediante `admin_id`, `admin_username` y `admin_password`. El primer registro de `se_admins` se marca como superadministrador (`admin_super`).
- `docs/legacy/admin/admin_logout.php` limpia la sesión administrativa y vuelve al login.
- `docs/legacy/admin/admin_home.php` presenta métricas y notificaciones de salud del sitio.
- `docs/legacy/admin/admin_viewusers.php` lista usuarios con filtros, orden y paginación de 100; también contiene eliminaciones.
- `docs/legacy/admin/admin_viewusers_edit.php` edita estado, email, username, nivel, categoría de perfil, invitaciones y contraseña, además de verificar usuarios y reenviar verificación.
- `docs/legacy/admin/admin_levels.php` y `admin_levels_edit.php` crean, editan, seleccionan nivel por defecto y eliminan niveles no predeterminados.

## Contrato inicial propuesto

### Actores

| Actor | Capacidades respaldadas | Destino inicial |
|---|---|---|
| Visitante | Ver login administrativo | `/admin/login` |
| Administrador autenticado y habilitado | Acceder a consola y dashboard | `/admin`, `/admin/dashboard` |
| Superadministrador | Distinción observada en legacy como primer `se_admins` | Pendiente de modelo/importación verificable |
| Usuario autenticado normal | No obtiene acceso por tener sesión de usuario | Denegado |
| Administrador deshabilitado o sesión inválida | No obtiene acceso | Login/403 según contexto |

### Primer alcance implementable

1. Frontera de rutas separada `/admin`, sin compartir automáticamente el layout de usuario.
2. Sesión administrativa separada de `social_session`, con cookie segura, `httpOnly`, `sameSite` y expiración verificable.
3. Guard server-side para distinguir  una sesión admin válida de una sesión de usuario normal.
4. Estados explícitos: login, sesión ausente, sesión expirada, administrador deshabilitado, acceso insuficiente y error de configuración.
5. Dashboard de solo lectura con métricas únicamente cuando existan tablas destino respaldadas.
6. Listado/edición de usuarios y gestión de niveles solo después de modelar y verificar `Admin`, `UserLevel`, `Subnetwork` y sus relaciones.

El primer corte de UI será el acceso administrativo y el shell protegido; no incluye todavía CRUD de usuarios, niveles ni configuración global porque esas operaciones tienen efectos secundarios y requieren contratos de datos destino confirmados.

## Autoridad pendiente en destino

El esquema Prisma actual contiene `User` y `AuthSession`, pero no contiene:

- `Admin` o una relación inequívoca `User → admin`;
- `AdminSession` separada;
- `UserLevel` y permisos/cuotas por nivel;
- `Subnetwork`;
- `Setting` o un catálogo de configuración global;
- reportes, mensajes, logins, estadísticas y anuncios necesarios para reproducir todas las métricas del dashboard.

No es válido usar `User.id`, `User.enabled` o la sesión `social_session` como sustitutos de `se_admins/admin_enabled` sin evidencia de equivalencia. Tampoco se debe considerar administrador a un usuario por username, email o valor inventado.

## Flujos y errores

| Flujo | Entrada | Resultado legacy | Decisión destino |
|---|---|---|---|
| Entrada `/admin` | Sin sesión admin | Redirección a login | Mantener frontera separada |
| Login admin | credenciales + `task=dologin` | login o error | Validación server-side pendiente de modelo Admin |
| Página protegida | cookie/sesión inválida | redirección a login | No consultar datos admin antes del guard |
| Admin deshabilitado | sesión existente | limpieza de sesión | Invalidar sesión admin |
| Logout | sesión admin | limpieza y login | Acción server-side separada |
| Usuario normal en `/admin` | `social_session` válida | no equivale a admin | Denegar sin filtrar datos |
| Configuración no disponible | sin tablas destino | no aplica | Mostrar estado de configuración, no inventar métricas |

## Reglas de seguridad

- La UI no controla autorización; cada página, handler y acción debe ejecutar el guard server-side.
- No reutilizar automáticamente `getCurrentUser()` como autorización administrativa.
- No mezclar DTOs administrativos con respuestas públicas o de usuario.
- No implementar eliminación, cambio de contraseña, cambio de nivel o configuración hasta definir validación, transacción, auditoría y permisos.
- No copiar credenciales, hashes, cookies o datos reales del legacy a código, fixtures o logs.

## Trazabilidad y pendientes

| Legacy | Destino | Estado |
|---|---|---|
| `se_admins` | `Admin` | Falta modelo y estrategia de importación |
| sesión `admin_*` | `AdminSession` | Falta modelo/contrato |
| `admin_enabled` | `Admin.enabled` | Falta modelo |
| `admin_super` | permiso/rol explícito | No asumir equivalencia; requiere decisión y evidencia |
| `se_users` | `User` | Existe modelo parcial; falta paridad de campos admin |
| `se_levels` | `UserLevel` | Falta modelo |
| `se_subnets` | `Subnetwork` | Falta modelo |
| `se_settings` | `Setting` | Falta modelo y catálogo seguro |
| `admin_home.php` | `/admin/dashboard` | Pendiente de métricas destino |
| `admin_viewusers*` | `/admin/users` | Pendiente de contrato y permisos |
| `admin_levels*` | `/admin/levels` | Pendiente de modelo y operaciones transaccionales |

## Decisión de cierre de este incremento

La administración pasa a ser el siguiente dominio de implementación, empezando por su frontera de acceso y no por el CRUD. Antes de habilitar una cuenta admin real se debe definir el modelo Prisma de autoridad, su origen/importación controlada y la estrategia de sesiones administrativas. Hasta entonces, cualquier ruta admin debe denegar por defecto y no presentar datos administrativos como si existiera paridad.

## Implementación realizada

- `src/app/admin/layout.tsx` crea una superficie administrativa separada del layout público y del layout autenticado de usuario.
- `src/app/admin/page.tsx` conserva la entrada `/admin` y la redirige a `/admin/login`, equivalente a la entrada legacy.
- `src/app/admin/login/page.tsx` muestra el estado de acceso administrativo sin presentar un formulario de credenciales ficticio.
- `src/server/admin/access.ts` expone `getAdminAccessState()` como frontera server-side deny-by-default. Mientras no exista `Admin`/`AdminSession`, devuelve `configuration-required`.
- La sesión `social_session` no se consulta ni se considera autorización administrativa.
- No se consultan tablas admin inexistentes ni se muestran métricas inventadas.

La pantalla actual informa que el acceso administrativo está pendiente de configuración y ofrece volver al sitio. Esto es deliberado: evita convertir una UI visible en una falsa capacidad administrativa.

## Validación ejecutada

- `pnpm exec tsc --noEmit` ✅
- `pnpm exec eslint src/server/admin/access.ts src/app/admin/layout.tsx src/app/admin/page.tsx src/app/admin/login/page.tsx` ✅
- `pnpm build` ✅; Next.js reconoce `/admin` y `/admin/login` y completa la compilación de producción.
- `git diff --check` ✅

No se ejecutaron pruebas contra una base real, migraciones, imports ni operaciones de escritura.

## Limitaciones del incremento

1. Todavía no existe login administrativo funcional: falta modelar `Admin`, credenciales compatibles y `AdminSession`.
2. No se habilita a ningún `User` como administrador por inferencia.
3. No existe dashboard con métricas, listado/edición de usuarios, niveles, subredes ni configuración.
4. El estado `configuration-required` es el único estado posible hasta que exista una autoridad destino verificable; no representa una autorización real.
5. La siguiente decisión técnica debe cubrir el modelo Prisma, la estrategia de IDs/credenciales legacy, cookies/sesiones, expiración, logout, recuperación y permisos de superadministrador antes de implementar acciones.

## Métricas verificadas del dashboard

El dashboard moderno expone únicamente conteos consultados desde modelos destino existentes y protegidos por sesión administrativa:

- usuarios totales (`User`);
- usuarios habilitados (`User.enabled`);
- usuarios verificados (`User.verifiedAt` no nulo);
- niveles en catálogo (`UserLevel`);
- subredes en catálogo (`Subnetwork`);
- registros de configuración no sensible (`Setting`).

Los tres últimos conteos pueden ser cero porque las tablas structure-only se aplicaron sin importar filas legacy. Cero no se interpreta como ausencia del esquema ni habilita una importación automática. No se exponen todavía métricas de mensajes, reportes, amistades, anuncios, logins, estadísticas, capacidades por nivel ni usuarios agrupados por nivel/subred.

La consulta vive en `src/server/admin/dashboard.ts` y se ejecuta después del guard de `src/server/admin/access.ts`; la UI no es el control de autorización. La presentación enlaza a las lecturas `/admin/levels`, `/admin/subnetworks` y `/admin/settings`, que permanecen en modo solo lectura.
