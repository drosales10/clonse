# Incremento 47 — Paridad de `article_search` entre listado y detalle

## Hallazgo

La revisión de `docs/legacy/article.php` y `docs/legacy/articles.php` mostró dos contratos distintos:

- `articles.php` usa `article_search = 1` para el catálogo/búsqueda.
- `article.php` exige existencia, `article_approved = 1`, `article_draft = 0` y privacidad compatible, pero no comprueba `article_search` antes de mostrar el detalle.

La implementación moderna aplicaba `searchable = true` a ambos flujos. Eso podía ocultar en el detalle un artículo aprobado, no borrador y visible que el legacy todavía permitía abrir directamente.

## Cambio

En `src/server/articles/service.ts`:

- `getArticleCatalog` mantiene `searchable = true`, conforme al listado legacy.
- `getArticleDetail` ya no filtra por `searchable`.
- El detalle conserva `approved = true`, `draft = false`, autor habilitado y privacidad server-side.
- La resolución sigue aceptando ID interno y `legacyId` numérico positivo.
- No se añaden tablas, migraciones, mutaciones ni efectos secundarios.

Las rutas afectadas siguen siendo:

- `GET /api/articles/[articleId]`;
- `/articles/[articleId]`.

## Resultado de seguridad

Retirar `searchable` del detalle no convierte el recurso en público por defecto: la privacidad continúa evaluándose después de la consulta. Los recursos inexistentes, no aprobados, borradores, privados o con autor deshabilitado siguen devolviendo 404 indistinguible.

El cuerpo continúa entregándose como texto seguro sin ejecutar HTML/BBCode legacy y las visitas no se incrementan durante el GET.

## Trazabilidad

| Regla | Listado | Detalle |
|---|---:|---:|
| `article_approved = 1` | Sí | Sí |
| `article_draft = 0` | Sí | Sí |
| `article_search = 1` | Sí | No, según `article.php` |
| privacidad compatible | Sí, antes de paginar | Sí, antes del DTO |
| autor habilitado | Sí | Sí |
| incremento de vistas | No | No, deliberadamente separado |

## Validación

- `pnpm exec tsc --noEmit` ✅
- Lint focalizado de servicio, dominio y detalle ✅
- `pnpm build` ✅
- `git diff --check` ✅; solo advertencia normal LF/CRLF de Git en Windows

## Pendientes

1. Crear fixtures sintéticos para verificar la diferencia entre un artículo no buscable abierto directamente y el mismo artículo excluido del catálogo.
2. Decidir el caso de uso idempotente para incrementar vistas si se requiere reproducir el efecto de `article.php`.
3. Confirmar la configuración efectiva del plugin antes de declarar paridad completa.
