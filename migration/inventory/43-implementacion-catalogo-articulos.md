# Incremento 43 — Catálogo nativo de artículos

## Estado

Implementado un catálogo de lectura de artículos sobre Next.js, React, TypeScript, Prisma y PostgreSQL. PHP/MySQL, `docs/legacy` y los datos reales permanecen intactos. No se importaron artículos, categorías, usuarios, uploads ni PII.

## Evidencia y límites de certeza

La estructura funcional procede de:

- `docs/legacy/articles.php`: listado, filtros `articlecat_id`, `p`, `keyword`, `f` y `tag`, estados requeridos, búsqueda por título/cuerpo, categorías raíz con descendientes, paginación de 10 y orden por fecha, visitas o título.
- `docs/legacy/article.php`: existencia, aprobación, no-borrador, privacidad antes de mostrar el detalle e incremento de visitas solo si el artículo es visible.
- `docs/Plugins install/install_article.php`: definición estructural de `se_articles` y `se_articlecats`, además de los campos de aprobación, búsqueda, privacidad, comentarios, destacado y foto.

`docs/se.sql` no contiene una confirmación de las tablas `se_articles`/`se_articlecats`. Por tanto, el instalador y el código se documentan como evidencia estructural, no como prueba de que el plugin esté activo en la instalación real. No se afirma paridad de activación ni de configuración efectiva de niveles/settings.

## Alcance implementado

- categorías activas raíz y subcategorías;
- artículos aprobados, no borradores y buscables;
- búsqueda server-side por título y cuerpo;
- filtro de destacados;
- orden por fecha de publicación, visitas o título;
- paginación de 10 artículos;
- autor público mínimo, categoría, fechas, destacado y visitas;
- privacidad server-side para propietario, usuario registrado y visitante anónimo;
- propietario habilitado como requisito adicional;
- extracto textual limitado, sin renderizar HTML legacy;
- estado vacío explícito;
- API `GET /api/articles` y UI `/articles`.

La privacidad no se delega a la UI. La lista se filtra antes de paginar, de modo que los totales y páginas no exponen artículos no visibles. El propietario puede leer su artículo; para otros lectores se aplican las máscaras conocidas `1` (owner), `16` (registered) y `32` (anonymous), conservando una política deny-by-default para valores no enteros o sin bit aplicable.

## Trazabilidad legacy → destino

| Legacy | Destino | Estado |
|---|---|---|
| `se_articlecats.articlecat_id` | `ArticleCategory.legacyId` | ID de correspondencia, sin filas importadas |
| `se_articlecats.articlecat_dependency` | `ArticleCategory.parentId` | Jerarquía interna; conversión pendiente de importador |
| `se_articlecats.articlecat_title` | `ArticleCategory.title` | Título de categoría |
| `se_articles.article_id` | `Article.legacyId` | ID de correspondencia, sin filas importadas |
| `se_articles.article_user_id` | `Article.authorId` → `User.id` | FK interna; requiere `UserIdentityMap` para importar |
| `se_articles.article_articlecat_id` | `Article.categoryId` | FK nullable a categoría destino |
| `se_articles.article_date_start` | `Article.publishedAt` | `DateTime`; conversión Unix queda para el importador |
| `se_articles.article_dateupdated` | `Article.updatedAt` | `DateTime`; conversión Unix queda para el importador |
| `se_articles.article_title` | `Article.title` | Texto de artículo |
| `se_articles.article_body` | `Article.body` | Persistible como contenido controlado; UI solo muestra extracto textual |
| `se_articles.article_views` | `Article.views` | Contador de lectura, sin incremento en este catálogo |
| `se_articles.article_draft` | `Article.draft` | Solo `false` entra en el listado |
| `se_articles.article_approved` | `Article.approved` | Solo `true` entra en el listado |
| `se_articles.article_search` | `Article.searchable` | Solo `true` entra en el listado |
| `se_articles.article_privacy` | `Article.privacy` | Máscara entera aplicada server-side |
| `se_articles.article_comments` | `Article.commentsPrivacy` | Persistido para futuro caso de uso; no habilita comentarios aquí |
| `se_articles.article_featured` | `Article.featured` | Filtro opcional de destacados |
| `se_articles.article_photo` | Fuera del primer catálogo | No se copian uploads ni referencias no verificadas |
| `se_articlecomments`, `se_articlealbums`, `se_articlemedia` | Fuera de alcance | Requieren contratos separados de detalle, media y comentarios |

No se añadieron `slug`, expiración, tags, detalle público, edición, creación, comentarios, notificaciones, media, álbumes ni estados no confirmados.

## Persistencia

Migración expand-only:

```text
packages/db/prisma/migrations/20260802150000_article_catalog/migration.sql
```

Modelos:

- `ArticleCategory` y `Article` en `packages/db/schema.prisma`;
- `User.articlesAuthored`;
- autor con `ON DELETE RESTRICT`;
- categoría padre y categoría de artículo con `ON DELETE SET NULL`;
- índices para ownership, jerarquía, estado de publicación, categoría, destacado y ordenación;
- sin inserts, backfills, drops ni truncates.

La migración fue aplicada localmente con `pnpm prisma migrate deploy`; el esquema quedó actualizado. La base legacy no fue consultada ni modificada durante este incremento.

## Contratos y rutas

- Dominio: `packages/domain/src/articles.ts`.
- Servicio server-side: `src/server/articles/service.ts`.
- API: `GET /api/articles`.
- UI: `/articles`.

Parámetros:

```text
page: entero positivo
search: texto limitado a 100 caracteres
categoryId: ID interno opcional
featured: 1 para limitar a destacados
sort: created | views | title
```

Una categoría raíz incluye descendientes; una subcategoría filtra solo esa categoría. El cuerpo no se devuelve en el DTO público: se transforma a un extracto textual limitado y sin etiquetas de presentación. La sanitización completa y el detalle requieren un incremento separado.

## Validación ejecutada

- `pnpm prisma validate` ✅
- `pnpm prisma generate` ✅
- `pnpm prisma migrate deploy` ✅; aplicó `20260802150000_article_catalog`
- `pnpm prisma migrate status` ✅; base local actualizada
- `pnpm exec tsc --noEmit` ✅
- `pnpm exec eslint packages/domain/src/articles.ts src/server/articles/service.ts src/app/api/articles/route.ts src/app/articles/page.tsx` ✅
- `pnpm build` ✅; incluye `/articles` y `/api/articles`
- `git diff --check` ✅; solo mostró la advertencia normal de conversión LF/CRLF de Git en Windows

El lint global continúa fuera del criterio de este incremento por errores preexistentes en JavaScript legacy bajo `docs/Forums/include/forum/fckeditor` y `docs/bussiness/include/js`.

## Pendientes

1. Confirmar contra un esquema MySQL autorizado si el plugin Article está instalado y activo.
2. Verificar settings, niveles, aprobación y valores efectivos de privacidad antes de declarar paridad.
3. Crear importador dry-run de categorías/artículos usando `UserIdentityMap`, sin PII ni escritura por defecto.
4. Definir estrategia PostgreSQL equivalente a la búsqueda FULLTEXT/filtros legacy.
5. Implementar detalle con sanitización robusta, URL compatible y decisión explícita sobre incremento de vistas.
6. Implementar comentarios, media, álbumes, notificaciones y uploads como casos de uso separados y autorizados.
7. Comparar filtros `tag` del legacy cuando exista evidencia suficiente para modelar tags sin inventar tablas activas.
