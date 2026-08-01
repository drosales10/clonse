# Incremento 51 — Detalle público de clasificados

## Estado

Implementado el detalle de lectura de clasificados sobre Next.js, React, TypeScript y Prisma. PHP/MySQL y `docs/legacy` permanecen intactos. No se importaron filas, usuarios, uploads ni datos con PII. No se creó una migración nueva porque `Classified` y `ClassifiedCategory` ya contienen los campos necesarios para esta lectura limitada.

## Evidencia legacy

`docs/legacy/classified.php` recibe `classified_id`, comprueba que exista el clasificado y que su propietario exista, calcula la privacidad mediante `owner->user_privacy_max($user)` y solo permite la lectura cuando la máscara coincide con `classified_privacy`. La página legacy no exige `classified_search` para el detalle; esa bandera pertenece al catálogo/búsqueda. También carga comentarios, media, estilos, campos dinámicos, notificaciones y contador de vistas.

El incremento moderno implementa solo los datos disponibles en el modelo destino y no declara paridad completa con las relaciones aún ausentes.

## Contrato y trazabilidad

| Legacy | Destino | Estado |
|---|---|---|
| `classified.php?classified_id=...` | `/classifieds/[classifiedId]` | Detalle server-rendered |
| `classified_id` interno | `Classified.id` | Resolución exacta |
| ID legacy numérico | `Classified.legacyId` | Resolución para enteros positivos |
| Identificador de catálogo moderno | `Classified.slug` | Resolución adicional, sin unión por email/username |
| `classified_title` | `Classified.title` | Mostrado como título |
| `classified_body` | `Classified.body` | Tags HTML eliminados y entidades básicas normalizadas a texto |
| `classified_user_id` | `Classified.ownerId` → `User` | Propietario y enlace a perfil |
| `classified_classifiedcat_id` | `Classified.categoryId` → `ClassifiedCategory` | Categoría mostrada si existe |
| `classified_date` | `Classified.createdAt` | Fecha mostrada como `DateTime` |
| `classified_dateupdated` | `Classified.updatedAt` | Fecha de actualización mostrada |
| `classified_privacy` | `Classified.privacy` | Evaluada server-side con `canReadClassified` |
| `classified_views` | `Classified.views` | Contador leído, no incrementado |
| comentarios legacy | `totalComments` | Solo contador existente; no se carga contenido |
| `classified_search` | `Classified.searchable` | No se exige en el detalle, conforme a `classified.php` |

## Capas y rutas

- Dominio: `packages/domain/src/classifieds.ts` (`PublicClassifiedDetail`, `canReadClassified`).
- Servicio: `src/server/classifieds/service.ts` (`getClassifiedDetail`).
- API: `GET /api/classifieds/[classifiedId]`.
- UI: `/classifieds/[classifiedId]`, Server Component compatible con `params` Promise de Next 16.
- Navegación: cada tarjeta de `/classifieds` enlaza al ID interno del clasificado.
- Persistencia: Prisma reutiliza `Classified` y `ClassifiedCategory`; no se usó SQL crudo ni se creó migración.

## Visibilidad efectiva

La consulta exige un propietario habilitado y posteriormente aplica la autorización server-side:

- propietario: permitido;
- usuario registrado: permitido si la máscara contiene el bit `REGISTERED`;
- visitante anónimo: permitido si la máscara contiene el bit `ANONYMOUS`;
- amistades, amigos de amigos y subredes: no se conceden porque esas relaciones no están disponibles en el servicio de detalle;
- propietario deshabilitado, registro inexistente, identificador vacío o privacidad incompatible: `404` / `CLASSIFIED_NOT_FOUND`.

La página y el Route Handler resuelven la sesión en servidor y llaman al mismo servicio autorizado. La UI no sustituye el control de acceso.

## Diferencias deliberadas y pendientes

No se implementan todavía:

1. Incremento de `classified_views`; el detalle es lectura pura y no introduce una mutación oculta en un GET.
2. Comentarios, eliminación de notificaciones y permisos de comentar.
3. Álbumes, media, miniaturas, uploads y validación de storage.
4. Campos dinámicos `se_classifiedfields`/`se_classifiedvalues`.
5. Estilos personalizados, plugins y acciones administrativas.
6. Privacidad completa basada en amistades, segundo grado, subredes, niveles y configuración global.
7. HTML/BBCode rico; por ahora el cuerpo se reduce a texto seguro antes de renderizarlo.

Estas diferencias quedan abiertas para incrementos verticales posteriores y no se presentan como paridad cerrada.

## Validación ejecutada

- `pnpm exec tsc --noEmit` ✅
- `pnpm exec eslint packages/domain/src/classifieds.ts src/server/classifieds/service.ts src/app/api/classifieds/route.ts src/app/api/classifieds/[classifiedId]/route.ts src/app/classifieds/page.tsx src/app/classifieds/[classifiedId]/page.tsx` ✅
- `pnpm build` ✅; incluye `/classifieds/[classifiedId]` y `/api/classifieds/[classifiedId]`.
- `git diff --check` ✅; Windows solo informa la normalización habitual LF/CRLF.

No se ejecutaron migraciones, backfills, imports ni operaciones contra datos reales.
