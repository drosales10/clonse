# Incremento 49 — Detalle público de negocios

## Estado

Implementado el detalle público de negocios sobre Next.js, React, TypeScript, Prisma y PostgreSQL. PHP/MySQL y `docs/legacy` permanecen intactos. No se creó migración nueva, no se importaron negocios, propietarios, campos dinámicos, fotos, mapas, ratings, comentarios, claims, pagos ni PII.

## Evidencia legacy

`docs/legacy/business.php` confirma el flujo de detalle mediante `business_id`:

- valida permiso global del módulo y nivel de negocio;
- resuelve el negocio y su propietario;
- exige existencia;
- exige aprobación;
- rechaza negocios expirados;
- evalúa `business_privacy` antes de mostrar;
- incrementa vistas solo después de autorizar;
- carga descripción, categoría, campos dinámicos, media, ratings, mapa y comentarios.

`docs/legacy/browse_businesses.php` exige `business_search = 1` para el catálogo. El detalle `business.php` no usa ese campo como condición de lectura. Por ello el catálogo moderno mantiene `searchable = true`, mientras el detalle exige aprobación, expiración y privacidad, pero no `searchable`.

## Alcance implementado

- resolución por ID interno Prisma;
- resolución por `business_id` legacy numérico positivo;
- resolución por slug moderno cuando exista;
- aprobación server-side;
- expiración server-side;
- propietario habilitado;
- privacidad para propietario, registrado y anónimo mediante la máscara disponible;
- título, resumen/descripción textual segura, categoría, propietario, ubicación, flags y contadores;
- API `GET /api/businesses/[businessId]`;
- UI `/businesses/[businessId]`;
- enlaces desde `/businesses`;
- 404 indistinguible para negocio inexistente o no visible.

La descripción se representa como texto seguro sin ejecutar HTML legacy. El modelo actual no contiene campos verificados para teléfono o URL originales; no se inventan ni se copian desde otra fuente. No se implementan vistas mutables, comentarios, ratings, media, mapas, campos dinámicos, estilos, claims, pagos, edición, alta, eliminación ni administración.

## Trazabilidad legacy → destino

| Legacy | Destino | Estado |
|---|---|---|
| `business_id` | `Business.id` o `Business.legacyId` | Ambos identificadores aceptados |
| `business_slug` | `Business.slug` | Resolución por slug destino |
| `business_approved` / `business_dateapproved` | `Business.approvedAt` | Requerido no nulo |
| `business_dateexpired` | `Business.expiresAt` | `NULL` o fecha futura permitida |
| `business_search` | `Business.searchable` | Requisito del catálogo, no del detalle |
| `business_privacy` | `Business.privacy` | Evaluado server-side |
| `business_user_id` | `Business.ownerId` → `User.id` | Importación requiere `UserIdentityMap` |
| `business_title` | `Business.title` | Título visible |
| `business_summary` | `Business.summary` | Fallback textual del detalle |
| `business_desc` | No se expone como HTML | La UI usa texto seguro del contenido modelado |
| `business_views` | `Business.views` | Se lee; no se incrementa en GET |
| `business_totalcomments` | `Business.totalComments` | Metadato; no se cargan comentarios |
| albums/media/mapas/ratings/claims/pagos | Fuera de alcance | Requieren contratos y adaptadores separados |

La privacidad completa legacy también contempla amistad, segundo grado y subred. Como esas relaciones no están modeladas en este destino, la lectura moderna aplica únicamente los bits de propietario/registrado/anónimo conocidos y conserva una política conservadora.

## Persistencia

No hay cambio de esquema. Se reutiliza `Business` y `BusinessCategory` de `20260802100000_business_catalog`. La consulta combina el OR de identificadores (interno, slug y legacy) con las condiciones de aprobación, expiración y propietario mediante `AND`, evitando que una rama de identificación salte las restricciones de disponibilidad.

No se ejecutaron migraciones nuevas, backfills ni escrituras sobre la base legacy.

## Contratos y archivos

- Dominio: `packages/domain/src/businesses.ts` (`PublicBusinessDetail`).
- Servicio: `src/server/businesses/service.ts` (`getBusinessDetail`).
- API: `src/app/api/businesses/[businessId]/route.ts`.
- UI: `src/app/businesses/[businessId]/page.tsx`.
- Catálogo enlazado: `src/app/businesses/page.tsx`.
- Estilos: `src/app/globals.css`.

La página Server Component y el Route Handler obtienen la sesión en servidor. Los identificadores numéricos se convierten a `legacyId` solo si son enteros positivos y seguros.

## Efectos secundarios excluidos

Aunque `business.php` incrementa vistas y limpia notificaciones de comentarios, este GET no realiza escrituras. El incremento de vistas deberá ser un caso de uso separado, idempotente y medido antes de declararse equivalente.

## Validación ejecutada

- `pnpm exec tsc --noEmit` ✅
- `pnpm exec eslint packages/domain/src/businesses.ts src/server/businesses/service.ts src/app/api/businesses/route.ts src/app/api/businesses/[businessId]/route.ts src/app/businesses/page.tsx src/app/businesses/[businessId]/page.tsx` ✅
- `pnpm build` ✅; incluye `/businesses/[businessId]` y `/api/businesses/[businessId]`
- `git diff --check` ✅; solo advertencias normales LF/CRLF de Git en Windows

## Pendientes

1. Resolver amistad, segundo grado, subred y niveles antes de declarar paridad completa de privacidad.
2. Confirmar títulos traducidos, campos dinámicos y estructura efectiva de la instalación.
3. Implementar sanitización robusta si se preserva formato HTML legacy.
4. Añadir media, mapas, ratings, comentarios, claims y pagos mediante adaptadores verificables.
5. Diseñar el incremento de vistas separado del GET.
6. Crear fixtures sintéticos para aprobación, expiración, privacidad, ID legacy y slug.
