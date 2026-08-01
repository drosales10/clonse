# Incremento 38 — Implementación del catálogo nativo de grupos

## Estado

Implementado un catálogo público de grupos sobre Next.js, React, TypeScript, Prisma y PostgreSQL. La raíz PHP/MySQL, `docs/legacy` y los datos reales no se modificaron. No se importaron grupos, usuarios, categorías, miembros, uploads ni PII.

## Alcance implementado

- categorías activas raíz y subcategorías;
- paginación de 10 elementos;
- orden estable por fecha de creación descendente;
- título, descripción, propietario y visitas;
- autorización server-side mediante una marca de visibilidad de catálogo validada;
- estado vacío explícito cuando todavía no hay grupos autorizados;
- API de lectura y página Server Component.

No se implementan todavía `friendsOnly`, orden por miembros, membresías, suscripciones, discusiones, media, comentarios, campos dinámicos, detalle, creación, edición, borrado ni administración.

## Trazabilidad legacy → destino

| Legacy | Destino | Estado |
|---|---|---|
| `se_groupcats` | `GroupCategory` / `group_categories` | Jerarquía, orden, activación y `legacyId` |
| `se_groups` | `Group` / `groups` | Datos nucleares del catálogo y `legacyId` |
| `group_user_id` | `Group.ownerId` → `User.id` | FK interna; no se resuelve por email/username |
| `group_groupcat_id` | `Group.categoryId` | FK nullable a categoría destino |
| `group_datecreated`/`group_dateupdated` | `createdAt`/`updatedAt` | `DateTime`; conversión Unix queda para importación |
| `group_search` | `searchable` | Solo grupos buscables se consideran |
| `group_privacy` | `privacy` | Máscara cruda conservada; bits no asumidos |
| `group_views` | `views` | Contador conservado; la lectura no lo incrementa |
| `group_totalmembers` | No modelado | No aparece confirmado en el `CREATE TABLE` revisado |
| `group_photo` | No modelado | Requiere adaptador seguro de storage |

Los campos dinámicos, miembros, suscripciones, discusiones, álbumes, media, comentarios, tags y estilos quedan fuera del primer catálogo.

## Decisión de visibilidad

El inventario confirma que la lectura de grupos depende de configuración, nivel, propietario, miembro activo, amistad con propietario o miembro y segundo grado. También confirma que no están implementados en el gemelo los mappings legacy, niveles, subredes, amistades ni membresías requeridos.

Además, el inventario no fija el valor numérico de todos los bits de `group_privacy`. Por ello no se usa una máscara inventada para hacer datos públicos. El modelo añade:

```text
catalogVisible: boolean, default false
```

`catalogVisible` es una decisión server-side de publicación del destino, no una copia ciega de `group_privacy`. Debe activarse únicamente mediante una futura transformación validada que haya resuelto la política legacy del grupo. El servicio además exige `searchable = true` y propietario habilitado. El propietario puede ser contemplado por el contrato de dominio, pero las consultas del catálogo público solo cargan registros `catalogVisible = true`.

Esta decisión hace que una base recién creada aparezca vacía de forma segura y evita declarar grupos privados como públicos por desconocer la semántica de la máscara.

## Persistencia

Migración expand-only:

- `packages/db/prisma/migrations/20260802120000_group_catalog/migration.sql`
- Modelos `GroupCategory` y `Group` en `packages/db/schema.prisma`.
- Relación `User.groupsOwned`.
- FKs explícitas:
  - propietario: `ON DELETE RESTRICT`;
  - categoría padre: `ON DELETE SET NULL`;
  - categoría de grupo: `ON DELETE SET NULL`.
- Índices para owner, jerarquía, categoría, visibilidad y paginación.
- No hay inserts, backfills, drops ni truncates.

La migración se aplicó localmente con `pnpm prisma migrate deploy` y el estado de Prisma quedó actualizado.

## Contrato y rutas

- Dominio: `packages/domain/src/groups.ts`.
- Servicio: `src/server/groups/service.ts`.
- API: `GET /api/groups`.
- UI: `/groups`.

Parámetros aceptados:

```text
page: entero positivo
categoryId: ID interno de categoría opcional
```

Una categoría raíz incluye sus descendientes; una subcategoría filtra exclusivamente esa categoría. Los IDs y la página se normalizan en servidor. No se aceptan columnas, SQL ni contexto de viewer desde el cliente.

## Validación ejecutada

- `pnpm prisma validate` ✅
- `pnpm prisma generate` ✅
- `pnpm prisma migrate deploy` ✅
- `pnpm prisma migrate status` ✅
- `pnpm exec tsc --noEmit` ✅
- `pnpm exec eslint packages/domain/src/groups.ts src/server/groups/service.ts src/app/api/groups/route.ts src/app/groups/page.tsx` ✅
- `pnpm build` ✅; incluye `/groups` y `/api/groups`.
- `git diff --check` ✅; Windows informa únicamente normalización LF/CRLF.

El lint global continúa fuera del criterio porque contiene fallos preexistentes en JavaScript legacy bajo `docs/Forums/include/forum/fckeditor` y `docs/bussiness/include/js`.

## Pendientes

1. Implementar `UserIdentityMap` antes de importar propietarios legacy.
2. Confirmar los valores efectivos de `group_privacy` y configurar una política por dominio versionada.
3. Modelar membresías con `status`, `approved`, `rank` y permisos de miembro.
4. Modelar amistades, subredes, niveles y segundo grado para paridad de lectura.
5. Definir el origen de los contadores de miembros y temas antes de mostrarlos.
6. Inventariar campos dinámicos efectivos y transformación segura de valores.
7. Implementar detalle, discusiones, comentarios, media, suscripciones y mutaciones como casos de uso transaccionales separados.
8. Añadir una transformación controlada que active `catalogVisible` solo después de reconciliar ACL, propietarios y estado del módulo.
