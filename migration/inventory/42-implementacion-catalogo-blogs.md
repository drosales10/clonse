# Incremento 42 — Catálogo nativo de blogs

## Estado

Implementado un catálogo de lectura de entradas de blog sobre Next.js, React, TypeScript, Prisma y PostgreSQL. PHP/MySQL, `docs/legacy` y los datos reales permanecen intactos. No se importaron entradas, categorías, usuarios, comentarios, suscripciones, trackbacks, estilos ni PII.

## Evidencia y diferencia deliberada

La evidencia legacy confirma:

- `blog.php` para el listado de entradas del blog de un propietario y el detalle por `blogentry_id`;
- `se_blogentries` y `se_blogentrycats`;
- búsqueda global `search_blog()` con FULLTEXT sobre título/cuerpo;
- filtros por categoría, rango de fechas y texto en el blog del propietario;
- paginación y privacidad por máscara;
- campos de comentarios, suscripciones y trackbacks como subflujos separados.

No se confirmó una página legacy de browse global idéntica a los catálogos de negocios/clasificados. Por eso `/blogs` se documenta como una lectura moderna del catálogo de entradas buscables y públicas, respaldada por el listado y la búsqueda legacy, no como una afirmación de paridad exacta de URL o pantalla global.

## Alcance implementado

- categorías activas raíz y subcategorías;
- búsqueda server-side por título y cuerpo;
- orden por fecha de creación o visitas;
- paginación de 10 entradas;
- autor público y categoría;
- fechas y contador de visitas;
- privacidad server-side para propietario, usuario registrado y visitante anónimo;
- extracto textual de cuerpo, sin renderizar HTML legacy;
- estado vacío explícito.

No se implementan detalle, edición, creación, comentarios, comentariosPrivacy como mutación, suscripciones, notificaciones, trackbacks, estilos CSS, archivos, campos dinámicos ni administración.

## Trazabilidad legacy → destino

| Legacy | Destino | Estado |
|---|---|---|
| `se_blogentrycats` | `BlogCategory` / `blog_categories` | Jerarquía, orden, activación y `legacyId` |
| `se_blogentries` | `BlogEntry` / `blog_entries` | Entrada, ownership, fechas, búsqueda, privacidad y vistas |
| `blogentry_user_id` | `BlogEntry.authorId` → `User.id` | FK interna; requiere `UserIdentityMap` para importar |
| `blogentry_blogentrycat_id` | `BlogEntry.categoryId` | FK nullable a categoría destino |
| `blogentry_date` | `createdAt` | `DateTime`; conversión Unix queda para el importador |
| `blogentry_title` | `title` | Texto de entrada |
| `blogentry_body` | `body` | Se conserva como texto/HTML controlado; UI solo muestra extracto textual |
| `blogentry_search` | `searchable` | Solo entradas buscables entran al catálogo |
| `blogentry_privacy` | `privacy` | Máscara entera; se aplican owner/registered/anonymous conocidos |
| `blogentry_comments` | `commentsPrivacy` | Persistido para futuro caso de uso, no autoriza mutaciones aquí |
| `blogentry_views` | `views` | Contador de lectura; no se incrementa durante el catálogo |
| `se_blogcomments` | Fuera de alcance | Requiere contrato de comentarios separado |
| `se_blogsubscriptions` | Fuera de alcance | Requiere sesión, mutación y notificaciones |
| `se_blogtrackbacks`/`se_blogpings` | Fuera de alcance | Integración externa y controles antiabuso |
| `se_blogstyles` | Fuera de alcance | CSS no confiable; requiere sanitización/aislamiento |

No se añadieron `slug`, aprobación, expiración ni estados no confirmados por la evidencia revisada.

## Persistencia

Migración expand-only:

```text
packages/db/prisma/migrations/20260802140000_blog_catalog/migration.sql
```

Modelos y relación:

- `BlogCategory` y `BlogEntry` en `packages/db/schema.prisma`;
- `User.blogEntriesAuthored`;
- `author_id` con `ON DELETE RESTRICT`;
- categoría padre y categoría de entrada con `ON DELETE SET NULL`;
- índices para ownership, jerarquía, búsqueda, categoría y paginación;
- sin inserts, backfills, drops ni truncates.

La migración fue aplicada localmente con `pnpm prisma migrate deploy`; el esquema quedó actualizado.

## Contrato y rutas

- Dominio: `packages/domain/src/blogs.ts`.
- Servicio server-side: `src/server/blogs/service.ts`.
- API: `GET /api/blogs`.
- UI: `/blogs`.

Parámetros:

```text
page: entero positivo
search: texto limitado a 100 caracteres
categoryId: ID interno opcional
sort: created | views
```

Una categoría raíz incluye descendientes; una subcategoría filtra únicamente esa categoría. La búsqueda usa filtros Prisma parametrizados. La máscara se evalúa después de consultar y antes de paginar para evitar contar entradas no visibles.

El cuerpo no se devuelve directamente en el DTO público: se transforma a un extracto textual limitado, eliminando etiquetas de presentación y evitando ejecutar HTML legacy. La sanitización completa del detalle sigue pendiente.

## Validación ejecutada

- `pnpm prisma validate` ✅
- `pnpm prisma generate` ✅
- `pnpm prisma migrate deploy` ✅
- `pnpm prisma migrate status` ✅
- `pnpm exec tsc --noEmit` ✅
- `pnpm exec eslint packages/domain/src/blogs.ts src/server/blogs/service.ts src/app/api/blogs/route.ts src/app/blogs/page.tsx` ✅
- `pnpm build` ✅; incluye `/blogs` y `/api/blogs`.
- `git diff --check` ✅; Windows informa únicamente normalización LF/CRLF.

El lint global continúa fuera del criterio de este incremento por errores preexistentes en JavaScript legacy bajo `docs/Forums/include/forum/fckeditor` y `docs/bussiness/include/js`.

## Pendientes

1. Crear `UserIdentityMap`/reconciliación antes de importar autores legacy.
2. Contrastar las columnas de publicación con el esquema efectivo autorizado, no solo con instaladores/código.
3. Definir estrategia PostgreSQL equivalente al FULLTEXT booleano MySQL.
4. Inventariar títulos de categorías traducibles y campos dinámicos si se van a importar.
5. Implementar detalle con sanitización robusta, contador de vistas decidido y privacidad completa de comentarios.
6. Implementar comentarios, suscripciones y notificaciones como casos de uso separados y transaccionales.
7. Tratar trackbacks/pings como integración antiabuso, no como una consulta pública.
8. Confirmar configuración efectiva del módulo y niveles antes de declarar paridad.
