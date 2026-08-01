# Incremento 45 — Detalle público de artículos

## Estado

Implementado el detalle de lectura de artículos sobre Next.js, React, TypeScript, Prisma y PostgreSQL. PHP/MySQL, `docs/legacy` y los datos reales permanecen intactos. No se creó una migración nueva, no se importaron artículos ni se copiaron cuerpos, uploads, comentarios o PII al repositorio.

## Evidencia legacy

`docs/legacy/article.php` confirma este flujo observable:

1. recibe `article_id`;
2. resuelve el artículo y rechaza inexistentes;
3. exige `article_approved = 1`;
4. exige `article_draft = 0`;
5. resuelve el propietario y evalúa `article_privacy` antes de mostrar;
6. incrementa `article_views` cuando el artículo es visible;
7. carga propietario, categoría, cuerpo, comentarios, media y tags.

El catálogo previo ya cubría los filtros y estados de listado. Este incremento añade solo la lectura detallada del artículo y deja fuera los subflujos que todavía no tienen contrato de destino.

## Contrato implementado

- Entrada: ID interno `articleId` y sesión opcional resuelta server-side.
- Resolución: `approved = true`, `draft = false`, `searchable = true`, autor habilitado y privacidad compatible con propietario/registrado/anónimo.
- Salida: título, cuerpo convertido a texto seguro, fechas, vistas persistidas, destacado, autor público mínimo y categoría.
- Recurso inexistente, no aprobado, borrador, autor deshabilitado o privado: respuesta 404 indistinguible.
- El ID recibido no se usa para saltar la comprobación de propietario, categoría o estado.

## Diferencia deliberada: lectura sin efecto secundario

El legacy incrementa las visitas durante `article.php`. La implementación moderna no actualiza `views` dentro de una lectura GET. Esta separación evita una mutación escondida y permite diseñar después un caso de uso idempotente de vistas, con reglas de deduplicación, autorización y evidencia de paridad propias.

Tampoco se implementan todavía:

- comentarios y autorización `article_comments`;
- álbumes, media y archivos;
- tags;
- sanitización/renderizado completo del HTML legacy;
- edición, creación, borradores o aprobación administrativa;
- URL por `legacyId`/slug compatible;
- notificaciones y correo.

El cuerpo del detalle se transforma a texto plano antes de llegar al DTO y se renderiza como texto conservando saltos, no como HTML o BBCode legacy. Es una política conservadora hasta incorporar un sanitizador y una allowlist de contenido verificadas.

## Rutas y archivos

- Dominio: `packages/domain/src/articles.ts` (`PublicArticleDetail`).
- Servicio: `src/server/articles/service.ts` (`getArticleDetail`).
- API: `GET /api/articles/[articleId]`.
- UI: `/articles/[articleId]`.
- Enlaces del catálogo: `src/app/articles/page.tsx`.
- Estilos: `src/app/globals.css`.

La UI usa un Server Component. La página muestra estado 404 mediante `notFound()` sin revelar si un ID privado existe. La API devuelve `ARTICLE_NOT_FOUND` con HTTP 404 para el mismo conjunto de condiciones.

## Trazabilidad

| Legacy | Destino | Estado |
|---|---|---|
| `article_id` | `Article.id` | Se usa ID interno; compatibilidad por `legacyId` queda pendiente |
| `article_approved` | `Article.approved` | Requerido en la consulta |
| `article_draft` | `Article.draft` | Requerido `false` |
| `article_search` | `Article.searchable` | Requerido `true` como política del catálogo |
| `article_privacy` | `Article.privacy` | Evaluado server-side antes del DTO |
| `article_user_id` | `Article.authorId` → `User.id` | Autor público mínimo; importación requiere `UserIdentityMap` |
| `article_articlecat_id` | `Article.categoryId` | Categoría pública mínima |
| `article_title` | `Article.title` | Título visible |
| `article_body` | `Article.body` | Se expone solo como texto seguro |
| `article_date_start` | `Article.publishedAt` | Fecha visible |
| `article_dateupdated` | `Article.updatedAt` | Persistida para futuras vistas |
| `article_views` | `Article.views` | Se lee; no se incrementa en GET |
| `article_comments`, media, tags | Fuera de alcance | Requieren contratos separados |

No se afirma que el plugin Article esté instalado o activo: `docs/se.sql` no confirma las tablas; la estructura proviene de código e instalador documentados en el incremento 43.

## Persistencia

No hay cambio de esquema para este incremento. Se reutilizan `Article` y `ArticleCategory` de `20260802150000_article_catalog`. No se ejecutó ninguna operación de escritura sobre la base legacy ni se añadió backfill.

## Validación ejecutada

- `pnpm exec tsc --noEmit` ✅
- `pnpm exec eslint packages/domain/src/articles.ts src/server/articles/service.ts src/app/api/articles/route.ts src/app/api/articles/[articleId]/route.ts src/app/articles/page.tsx src/app/articles/[articleId]/page.tsx` ✅
- `pnpm build` ✅; incluye `/articles/[articleId]` y `/api/articles/[articleId]`
- `git diff --check` ✅; solo advertencias normales LF/CRLF de Git en Windows

## Pendientes

1. Decidir y probar el incremento de vistas equivalente a `article.php` sin mezclarlo con GET.
2. Implementar sanitización robusta si se requiere preservar formato HTML/BBCode de los cuerpos legacy.
3. Definir URL compatible basada en `legacyId` y/o slug cuando exista evidencia del plugin activo.
4. Añadir comentarios con privacidad, paginación y notificaciones como caso transaccional separado.
5. Añadir media/álbumes/tags solo después de confirmar tablas y estrategia de storage.
6. Verificar configuración efectiva de permiso de registro, niveles y máscaras antes de declarar paridad.
