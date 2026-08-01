# Incremento 52 — Detalle público de grupos

## Estado

Implementado el detalle de lectura de grupos sobre Next.js, React, TypeScript y Prisma. PHP/MySQL y `docs/legacy` permanecen intactos. No se importaron grupos, usuarios, miembros, uploads ni PII. No se creó una migración nueva porque `Group` y `GroupCategory` ya contienen los datos nucleares necesarios para esta lectura limitada.

## Evidencia legacy

`docs/legacy/group.php` recibe `group_id`, comprueba el permiso global del módulo y la existencia del grupo, calcula `group_privacy_max($user)` y deriva permisos independientes para ver, comentar, discutir, subir fotos e invitar. Si el grupo es visible, incrementa vistas y carga miembros, oficiales, comentarios, media, discusiones, campos dinámicos, suscripciones, notificaciones y estilos.

La implementación moderna cubre únicamente el detalle nuclear disponible y no declara paridad completa de `group_privacy_max()` porque no están modelados miembros, amistades, subredes, niveles ni permisos efectivos del módulo.

## Contrato y trazabilidad

| Legacy | Destino | Estado |
|---|---|---|
| `group.php?group_id=...` | `/groups/[groupId]` | Detalle server-rendered |
| `group_id` interno | `Group.id` | Resolución exacta |
| ID legacy numérico | `Group.legacyId` | Resolución para enteros positivos |
| `group_title` | `Group.title` | Mostrado como título |
| `group_desc` | `Group.description` | Tags HTML eliminados y entidades básicas normalizadas a texto |
| `group_user_id` | `Group.ownerId` → `User` | Propietario y enlace a perfil |
| `group_groupcat_id` | `Group.categoryId` → `GroupCategory` | Categoría mostrada si existe |
| `group_datecreated` | `Group.createdAt` | Fecha mostrada como `DateTime` |
| `group_dateupdated` | `Group.updatedAt` | Fecha de actualización mostrada |
| `group_views` | `Group.views` | Contador leído, no incrementado |
| `group_privacy` | `Group.privacy` | Conservado en modelo, pero no se interpreta con bits inventados |
| Política pública destino | `Group.catalogVisible` | Único indicador seguro para viewers no propietarios |
| `group_search` | `Group.searchable` | Se mantiene en catálogo; no se exige en detalle |

## Visibilidad efectiva

La consulta exige un propietario habilitado y después aplica `canReadGroup`:

- propietario: puede leer su grupo aunque `catalogVisible` sea falso;
- viewer no propietario: solo puede leer grupos con `catalogVisible = true`;
- grupo inexistente, propietario deshabilitado o visibilidad incompatible: `404` / `GROUP_NOT_FOUND`.

`catalogVisible` no se presenta como una traducción automática de `group_privacy`; es una marca de publicación del destino que solo debe activarse mediante una transformación futura con ACL legacy reconciliada. Esta decisión evita publicar grupos privados por desconocer la semántica efectiva de la máscara.

La página y el Route Handler resuelven la sesión en servidor y llaman al mismo servicio autorizado. La UI no sustituye el control de acceso.

## Diferencias deliberadas y pendientes

No se implementan todavía:

1. Incremento de `group_views`; el detalle es lectura pura y no introduce una mutación oculta en un GET.
2. Miembros, oficiales, solicitudes, aprobaciones, rangos y suscripciones.
3. Privacidad completa por amistades, miembros, segundo grado, subredes, niveles y configuración del módulo.
4. Discusiones, temas, posts, comentarios, notificaciones y acciones del feed.
5. Álbumes, fotos, uploads, miniaturas y storage.
6. Campos dinámicos `se_groupfields`/`se_groupvalues`.
7. CSS personalizado y plugins.
8. HTML/BBCode rico; la descripción se reduce a texto seguro antes de renderizarla.

Estas diferencias quedan abiertas para incrementos verticales posteriores y no se presentan como paridad cerrada.

## Validación ejecutada

- `pnpm exec tsc --noEmit` ✅
- `pnpm exec eslint packages/domain/src/groups.ts src/server/groups/service.ts src/app/api/groups/route.ts src/app/api/groups/[groupId]/route.ts src/app/groups/page.tsx src/app/groups/[groupId]/page.tsx` ✅
- `pnpm build` ✅; incluye `/groups/[groupId]` y `/api/groups/[groupId]`.
- `git diff --check` ✅; Windows solo informa la normalización habitual LF/CRLF.

No se ejecutaron migraciones, backfills, imports ni operaciones contra datos reales.
