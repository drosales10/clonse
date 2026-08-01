# Incremento 48 — Detalle público de entradas de blog

## Estado

Implementado el detalle de entradas de blog sobre Next.js, React, TypeScript, Prisma y PostgreSQL. PHP/MySQL y `docs/legacy` permanecen intactos. No se creó una migración nueva, no se importaron entradas ni se copiaron comentarios, trackbacks, estilos, uploads o PII.

## Evidencia legacy

`docs/legacy/blog.php` implementa listado y detalle en la misma ruta mediante `blogentry_id`:

- exige acceso de registro según `setting_permission_blog` cuando corresponde;
- exige propietario existente y blog habilitado para el nivel del propietario;
- aplica `blogentry_privacy` antes de listar o mostrar;
- cuando `blogentry_id` produce una única entrada, muestra el detalle;
- incrementa vistas para lectores distintos del propietario;
- carga comentarios, privacidad de comentarios, trackbacks, RDF de trackback, suscripciones y notificaciones.

`docs/legacy/browse_blogs.php` usa `blogentry_search` para la superficie de catálogo/búsqueda global. El detalle por `blogentry_id` de `blog.php` no exige ese campo, por lo que la lectura moderna mantiene esa separación: el catálogo filtra `searchable = true`; el detalle no lo usa como requisito.

No se encontró un `blog_entry.php` independiente. `user_blog_entry.php` es el editor autenticado y no se utiliza como fuente para autorizar el detalle público.

## Alcance implementado

- resolución por ID interno moderno o `legacyId` numérico positivo (`blogentry_id`);
- autor habilitado como mínimo operativo del destino;
- privacidad server-side con propietario, usuario registrado y anónimo;
- título, categoría, autor, fechas y visitas persistidas;
- cuerpo transformado a texto seguro sin ejecutar HTML/BBCode legacy;
- respuesta 404 indistinguible para entrada inexistente o no visible;
- API `GET /api/blogs/[entryId]`;
- UI `/blogs/[entryId]`;
- enlaces desde el catálogo `/blogs`.

La lectura es pura: no incrementa vistas, limpia notificaciones ni actualiza suscripciones. No se implementan comentarios, trackbacks, RDF, suscripciones, notificaciones, estilos personalizados, edición, creación, tags, uploads ni URL slug.

## Trazabilidad legacy → destino

| Legacy | Destino | Estado |
|---|---|---|
| `blogentry_id` | `BlogEntry.id` o `BlogEntry.legacyId` | Ambos identificadores aceptados |
| `blogentry_user_id` | `BlogEntry.authorId` → `User.id` | Requiere `UserIdentityMap` para importar |
| `blogentry_privacy` | `BlogEntry.privacy` | Evaluado antes del DTO |
| `blogentry_title` | `BlogEntry.title` | Texto visible |
| `blogentry_body` | `BlogEntry.body` | Expuesto solo como texto seguro |
| `blogentry_date` | `BlogEntry.createdAt` | Fecha visible |
| `blogentry_views` | `BlogEntry.views` | Se lee; no se incrementa durante GET |
| `blogentry_search` | `BlogEntry.searchable` | Requisito del catálogo, no del detalle |
| `blogentry_comments` | `BlogEntry.commentsPrivacy` | Persistido para futuro caso de uso |
| `se_blogcomments` | Fuera de alcance | Requiere contrato de comentarios |
| `se_blogtrackbacks`/`se_blogpings` | Fuera de alcance | Requiere integración y controles antiabuso |
| `se_blogsubscriptions` | Fuera de alcance | Requiere sesión, mutación y notificaciones |
| `se_blogstyles` | Fuera de alcance | CSS legacy no se ejecuta |

No se declara que el blog esté activo en la instalación real: la documentación previa no confirma todas las tablas/configuraciones efectivas de la instancia legacy.

## Persistencia

No hay cambio de esquema. Se reutilizan `BlogEntry` y `BlogCategory` de `20260802140000_blog_catalog`. No se ejecutaron migraciones nuevas, backfills ni escrituras sobre PHP/MySQL.

## Contratos y archivos

- Dominio: `packages/domain/src/blogs.ts` (`PublicBlogEntryDetail`).
- Servicio: `src/server/blogs/service.ts` (`getBlogEntryDetail`).
- API: `src/app/api/blogs/[entryId]/route.ts`.
- UI: `src/app/blogs/[entryId]/page.tsx`.
- Catálogo enlazado: `src/app/blogs/page.tsx`.
- Estilos: `src/app/globals.css`.

La página Server Component y el Route Handler resuelven la sesión en servidor. El identificador numérico se convierte a `legacyId` solo si es entero positivo y seguro; valores inválidos no se fuerzan a IDs.

## Validación ejecutada

- `pnpm exec tsc --noEmit` ✅
- `pnpm exec eslint packages/domain/src/blogs.ts src/server/blogs/service.ts src/app/api/blogs/route.ts src/app/api/blogs/[entryId]/route.ts src/app/blogs/page.tsx src/app/blogs/[entryId]/page.tsx` ✅
- `pnpm build` ✅; incluye `/blogs/[entryId]` y `/api/blogs/[entryId]`
- `git diff --check` ✅; solo advertencias normales LF/CRLF de Git en Windows

## Pendientes

1. Decidir el caso de uso idempotente de incremento de vistas equivalente al legacy.
2. Implementar sanitización robusta si se quiere conservar formato permitido del cuerpo.
3. Crear comentarios con su privacidad, paginación y notificaciones como caso separado.
4. Implementar trackbacks/pings mediante un adaptador antiabuso, no como lectura indiscriminada.
5. Implementar suscripciones y limpieza de notificaciones con autorización y transacciones.
6. Confirmar settings, niveles, tablas y activación efectiva antes de declarar paridad completa.
