## Decisión

Se añade una autoridad administrativa separada de `User` y `AuthSession`, trazable a `se_admins` y a la sesión `admin_*` del legacy. No se reutiliza la sesión normal del sitio ni se infiere privilegio desde email, username, `enabled` o el primer usuario.

Este incremento solo añade el contrato y la infraestructura server-side. No crea administradores, no importa hashes, no copia credenciales y no habilita login real hasta una importación controlada.

## Modelo destino

### `Admin`

- `id`: identificador interno `cuid()`.
- `legacyId`: ID entero opcional de `se_admins`, único cuando exista.
- `username`: identificador de login administrativo, único.
- `displayName` y `email`: datos de contacto separados de `User`.
- `passwordHash`: hash compatible con el formato destino; nunca se registra ni se devuelve.
- `passwordMethod`: código legacy conservado para decidir una migración explícita; el login moderno solo acepta el formato seguro implementado.
- `enabled`: equivalente verificable de `admin_enabled`.
- `isSuperAdmin`: permiso explícito destino. No se rellena automáticamente desde el orden de `se_admins`; esa regla legacy requiere una transformación documentada.
- `createdAt` y `updatedAt`: fechas destino.

### `AdminSession`

- `id`: hash SHA-256 del token opaco, nunca el token en claro.
- `adminId`: relación a `Admin` con borrado en cascada de sesiones.
- `expiresAt`: expiración server-side.
- `createdAt`: auditoría mínima de creación.

La cookie `social_admin_session` es distinta de `social_session`, `httpOnly`, `sameSite=lax`, `secure` en producción y con `path=/admin`. El token en claro solo existe durante la emisión y lectura de la cookie; las consultas usan su hash.

## Estados de acceso

- `configuration-required`: no hay autoridad administrativa/configuración disponible; acceso denegado.
- `unauthenticated`: no hay cookie o la sesión no existe/expiró.
- `disabled`: la sesión apunta a un admin deshabilitado; la sesión se revoca.
- `authenticated`: admin habilitado con sesión vigente.

Las páginas protegidas deben tratar cualquier estado distinto de `authenticated` como no autorizado. El login y el logout serán acciones server-side posteriores; no se implementa recuperación administrativa en este corte.

## Credenciales

El formato moderno será `scrypt:<salt hex>:<derived key hex>`, igual al contrato actualmente usado para usuarios. La verificación usa comparación constante. Los códigos legacy `crypt`, MD5, SHA1 y CRC32 observados en `SEAdmin::admin_password_crypt()` no se ejecutan en el nuevo login sin una decisión explícita de compatibilidad y una migración de credenciales; no se debilita el destino para facilitar el import.

## Migración y datos

- La migración Prisma será aditiva: crea únicamente `admins` y `admin_sessions`, índices y foreign key.
- No altera `users`, `auth_sessions` ni tablas legacy.
- No contiene `INSERT`, seeds, contraseñas, emails reales ni PII.
- `legacyId` permite reconciliar posteriormente `se_admins.admin_id` sin usarlo como PK destino.
- La transformación posterior debe decidir cómo convertir `admin_code`/`admin_password`, cómo determinar `isSuperAdmin` y cómo invalidar sesiones legacy.
- Hasta que esa transformación exista, ninguna cuenta administrativa se considera habilitada en el gemelo.

## Trazabilidad

| Legacy | Destino | Estado |
|---|---|---|
| `se_admins.admin_id` | `admins.legacy_id` | Preparado para importación controlada |
| `se_admins.admin_username` | `admins.username` | Campo separado |
| `se_admins.admin_name` | `admins.display_name` | Campo separado |
| `se_admins.admin_email` | `admins.email` | Campo separado |
| `se_admins.admin_password` | `admins.password_hash` | No importar todavía; revisar método |
| `se_admins.admin_enabled` | `admins.enabled` | Mapeo booleano pendiente de importación |
| primer `admin_id` legacy | `admins.is_super_admin` | No automático; requiere decisión/evidencia |
| sesión `admin_id` y valores derivados | `admin_sessions` | Nueva sesión opaca y hashada |

## Fuera de alcance

No se implementan todavía login/logout UI, recuperación, dashboard, permisos por módulo, niveles, subredes, configuración global, auditoría completa ni CRUD de administradores. Esos flujos requieren sus tablas/contratos y pruebas 401/403/expiración antes de habilitar acciones.

## Implementación realizada

- `packages/db/schema.prisma` incorpora `Admin` y `AdminSession` con `legacyId`, `enabled`, `isSuperAdmin`, índices y relación explícita con borrado en cascada de sesiones.
- `packages/db/prisma/migrations/20260802170000_admin_authority/migration.sql` crea ambas tablas de forma aditiva, sin `INSERT`, seed ni datos reales.
- `src/server/admin/credentials.ts` implementa hash y verificación scrypt con comparación constante; rechaza formatos legacy no migrados.
- `src/server/admin/session.ts` implementa autenticación por username, emisión de sesiones, expiración, revocación y lectura del admin actual. La base guarda SHA-256 del token opaco, no el token en claro.
- `src/server/admin/access.ts` expone `getAdminAccessState()` y `requireAdminAccess()` para que cada superficie protegida autorice en servidor.
- La cookie administrativa usa `social_admin_session`, `httpOnly`, `sameSite=lax`, `secure` en producción y scope `/admin`.
- No se creó ninguna cuenta, seed ni acción de login UI; sin datos importados, el acceso permanece no autenticado/denegado.

## Validación ejecutada

- `pnpm exec prisma generate` ✅
- `pnpm exec tsc --noEmit` ✅
- `pnpm exec eslint src/server/admin/access.ts src/server/admin/credentials.ts src/server/admin/session.ts src/app/admin/layout.tsx src/app/admin/page.tsx src/app/admin/login/page.tsx` ✅
- `pnpm build` ✅; Next.js reconoce `/admin` y `/admin/login` y termina la compilación de producción.
- `git diff --check` ✅

No se aplicó `prisma migrate`, no se conectó a una base para importar datos y no se modificaron PHP/MySQL ni `docs/legacy`.

## Limitaciones actuales

1. La migración SQL está preparada pero pendiente de aplicación controlada sobre PostgreSQL destino.
2. No existe aún un flujo UI de login/logout ni recuperación administrativa.
3. No se ha definido la transformación de hashes legacy ni la asignación de `isSuperAdmin`.
4. No se han implementado niveles, subredes, permisos por módulo, dashboard, usuarios ni configuración.
5. El estado `disabled` se revoca durante la lectura de una sesión; el origen de esa deshabilitación será el campo `Admin.enabled` tras disponer de datos.
