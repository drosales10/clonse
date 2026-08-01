# Incremento 46 — Compatibilidad de ID legacy en detalle de artículos

## Estado

El detalle de artículos acepta ahora tanto el ID interno Prisma como el `article_id` numérico observado en `docs/legacy/article.php`, sin crear tablas, migraciones, slugs ni modificar PHP/MySQL.

## Cambio implementado

`getArticleDetail(viewerId, articleId)` resuelve mediante una condición OR controlada:

- `Article.id = articleId` para la navegación moderna;
- `Article.legacyId = N` cuando `articleId` es una cadena numérica positiva segura.

Los valores no numéricos no se fuerzan a enteros. Los valores no positivos, demasiado grandes o no seguros no se convierten en un `legacyId` válido.

La compatibilidad no relaja la autorización: después de resolver el candidato se siguen exigiendo:

- `approved = true`;
- `draft = false`;
- `searchable = true`;
- autor habilitado;
- máscara de privacidad compatible con la sesión server-side.

Un artículo inexistente, privado, no aprobado, borrador, no buscable o con autor deshabilitado continúa produciendo 404 indistinguible.

## Rutas afectadas

- `GET /api/articles/[articleId]` acepta ambos identificadores.
- `/articles/[articleId]` acepta ambos identificadores.
- Los enlaces del catálogo continúan usando el ID interno moderno.

No se afirma compatibilidad completa con el rewrite legacy `/article/{article_id}/{slug}` porque todavía no existe un campo `slug` destino confirmado. La compatibilidad añadida se limita al identificador de recurso.

## Trazabilidad

| Legacy | Destino | Estado |
|---|---|---|
| `article.php?article_id=N` | `GET /api/articles/N` o `/articles/N` | Resuelve por `Article.legacyId` |
| navegación moderna | `/articles/{Article.id}` | Resuelve por ID interno |
| `article_slug` del rewrite del instalador | Fuera de alcance | No confirmado/modelado |

## Persistencia y privacidad

No hay cambio de esquema. Se reutiliza el índice único existente de `Article.legacyId`. No se importan filas ni se ejecutan consultas contra la base legacy.

La vista continúa siendo pura: no incrementa `Article.views`. El incremento de vistas legacy queda pendiente como caso de uso idempotente separado.

## Validación

- `pnpm exec tsc --noEmit` ✅
- Lint focalizado de dominio, servicio, API y página de detalle ✅
- `pnpm build` ✅; las rutas `/articles/[articleId]` y `/api/articles/[articleId]` compilan
- `git diff --check` ✅; solo advertencia normal LF/CRLF de Git en Windows

## Pendientes

1. Definir y verificar slugs antes de implementar rewrites completos.
2. Probar con fixtures sintéticos que un ID interno y un `legacyId` apuntan al mismo DTO.
3. Implementar el contador de vistas como mutación separada si la paridad del efecto secundario lo exige.
4. No declarar paridad URL completa mientras no se confirme activación y configuración efectiva del plugin Article.
