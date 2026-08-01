# Incremento 36 — Implementación del catálogo nativo de clasificados

## Estado

Implementado el catálogo de lectura nativo sobre Next.js, React, TypeScript, Prisma y PostgreSQL. La raíz PHP/MySQL y `docs/legacy` permanecen intactos. No se importaron filas, categorías, usuarios, uploads ni datos reales.

## Trazabilidad

| Evidencia legacy | Destino nativo | Alcance |
|---|---|---|
| `se_classifiedcats` | `ClassifiedCategory` / `classified_categories` | Categorías activas, jerarquía, orden y `legacyId` |
| `se_classifieds` | `Classified` / `classifieds` | Título, cuerpo, propietario, categoría, fechas UTC, búsqueda, privacidad y contadores |
| `classified_user_id` | `Classified.ownerId` → `User.id` | Relación explícita; no se une por email o username |
| `classified_classifiedcat_id` | `Classified.categoryId` → `ClassifiedCategory.id` | FK nullable con `ON DELETE SET NULL` |
| `classified_date`, `classified_dateupdated` | `createdAt`, `updatedAt` | `DateTime`; la conversión Unix queda pendiente del importador |
| `classified_privacy` | `privacy` | Máscara entera, sin convertir a enum |
| `classified_search` | `searchable` | Solo registros marcados como buscables entran en el catálogo |

Las tablas de campos dinámicos, valores, álbumes, media, comentarios, estilos y administración quedan fuera de este incremento porque el inventario 28 requiere contratos adicionales para no inventar columnas, storage, sanitización o permisos.

## Persistencia

Migración expand-only:

- `packages/db/prisma/migrations/20260802103000_classified_catalog/migration.sql`
- Tablas `classified_categories` y `classifieds`.
- Índices para jerarquía, ownership, categoría, búsqueda, paginación y `legacyId`.
- `owner_id` usa `ON DELETE RESTRICT`.
- Categoría padre y categoría de anuncio usan `ON DELETE SET NULL`.
- No hay inserts, backfills, drops ni truncates.

La migración se aplicó localmente con `pnpm prisma migrate deploy`; `pnpm prisma migrate status` confirma que el esquema está actualizado. Se mantiene el mismo enfoque manual revisable usado para negocios porque `migrate dev` no puede construir el shadow database debido a una inconsistencia histórica previa (`profile_comments`); no se modificaron migraciones históricas.

## Contrato y servidor

- Contrato de dominio: `packages/domain/src/classifieds.ts`.
- Servicio: `src/server/classifieds/service.ts`.
- API de lectura: `GET /api/classifieds`.
- Página: `/classifieds`.

La entrada acepta `page`, `search`, `categoryId` y los órdenes cerrados `created`, `updated`, `views` y `comments`. La paginación es de 10 elementos. Una categoría raíz incluye sus descendientes; una subcategoría filtra únicamente esa categoría. La búsqueda aplica sobre título, cuerpo y slug mediante filtros Prisma parametrizados.

La visibilidad server-side exige propietario habilitado, `searchable = true` y máscara compatible con el viewer: propietario, usuario registrado o visitante anónimo. No se inventan filtros de aprobación ni expiración. La UI únicamente presenta datos ya autorizados y no es el control de seguridad.

## UI

`/classifieds` incluye navegación, búsqueda, orden, categorías raíz, tarjetas de resultados, propietario público, contadores, estado vacío y paginación. El enlace `/businesses` permite pasar entre ambos catálogos. No hay creación, edición, borrado, comentarios, media, subida de archivos ni administración en esta fase.

## Validación ejecutada

- `pnpm prisma validate` ✅
- `pnpm prisma generate` ✅
- `pnpm prisma migrate deploy` ✅
- `pnpm prisma migrate status` ✅
- `pnpm exec tsc --noEmit` ✅
- `pnpm exec eslint packages/domain/src/classifieds.ts src/server/classifieds/service.ts src/app/api/classifieds/route.ts src/app/classifieds/page.tsx` ✅
- `pnpm build` ✅; incluye `/classifieds` y `/api/classifieds`.
- `git diff --check` ✅; solo informa la normalización de LF/CRLF existente de Windows.

El lint global no se usa como criterio de este incremento porque contiene errores preexistentes en JavaScript legacy bajo `docs/Forums/include/forum/fckeditor` y `docs/bussiness/include/js`.

## Pendientes explícitos

1. Resolver `UserIdentityMap`/IDs legacy antes de importar usuarios o clasificados.
2. Inventariar categorías efectivas y campos dinámicos antes de importar valores.
3. Definir una estrategia PostgreSQL equivalente al FULLTEXT booleano de MySQL.
4. Añadir adaptador seguro de miniaturas/storage, fuera de la UI actual.
5. Cerrar políticas de amistad, subred, segundo grado y configuración de módulo para paridad completa.
6. Implementar detalle, creación/edición, comentarios, media y administración como incrementos separados con sus propias matrices de paridad.
