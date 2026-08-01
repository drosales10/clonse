# Incremento 54 — Navegación explícita de categorías del foro

## Estado

Implementada la ruta pública `/forum/[instanceId]/categories/[categoryId]`, equivalente de lectura al índice de categoría de `category_controller.index`. PHP/MySQL, `docs/legacy` y el esquema Prisma permanecen intactos. No se ejecutaron migraciones, imports ni operaciones sobre datos reales.

## Evidencia legacy

El dispatcher del foro admite rutas de categoría con `instance_id`, `category_id`, acción y página. `SEP_CategoryController::index` valida que la instancia exista, que la categoría pertenezca a ella, que tenga `parent_id`, que exista su categoría padre y que `SEP_Forum_Models::can_read` permita la lectura. Después lista posts raíz de esa categoría, ordenados por anuncio, fijado y última actividad, con paginación.

La ruta moderna no copia las mutaciones de creación, edición ni adjuntos de `category_controller`; solo implementa la lectura pública.

## Implementación

- Ruta: `/forum/[instanceId]/categories/[categoryId]`.
- Servicio reutilizado: `getForumCatalog`.
- La página exige una categoría hija pública y un padre público de la misma instancia.
- La consulta devuelve topics raíz de la categoría, autores habilitados, extractos de texto seguro, flags, contadores y paginación.
- Los enlaces de subcategorías aparecen en `/forum/[instanceId]`.
- Los enlaces de topics mantienen `categoryId` para preservar la pertenencia instancia → categoría → topic.
- El resolver jerárquico conserva el comportamiento especial de las categorías raíz en el catálogo general, pero una subcategoría filtra exactamente su propio ID para igualar `category_controller.index`.

## Autorización efectiva

La implementación moderna solo autoriza categorías con `publicCanRead = true` y todos sus ancestros públicos. No se concede acceso por nivel, subred, categoría de perfil ni moderadores porque esas relaciones legacy no están modeladas de forma verificable en el destino. La UI no es el control de seguridad; el servicio valida la pertenencia y la ACL antes de consultar topics.

Una categoría inexistente, raíz sin índice de topics, de otra instancia o no pública devuelve una vista de no disponibilidad y no expone temas.

## Trazabilidad

| Legacy | Destino | Estado |
|---|---|---|
| `category_controller.index` | `/forum/[instanceId]/categories/[categoryId]` | Lectura pública paginada |
| `instance_id` | `ForumInstance.id` | Pertenencia validada |
| `category_id` | `ForumCategory.id` | Categoría hija validada |
| `parent_id` | `ForumCategory.parentId` | Padre público obligatorio |
| `public_can_read` | `ForumCategory.publicCanRead` | Única ACL habilitada |
| `Post.parent_id IS NULL` | `ForumPost.parentId = null` | Solo topics raíz |
| `Post.is_announcement/is_sticky` | Flags Prisma | Presentación y orden conservados |
| `Post.cache_last_post_created` | `createdAt`/última respuesta disponible | Orden moderno estable |
| paginación legacy | `makePagination` | Tamaño server-side 10 |

## Diferencias y pendientes

1. No se implementa `can_write`, creación de topics, edición, adjuntos ni moderación.
2. No se resuelven ACL por niveles, subredes, categorías de perfil ni moderadores serializados.
3. No se incrementan vistas ni se ejecutan cambios de estado de lectura.
4. El contenido HTML/BBCode se muestra como texto seguro; no se reproduce todavía el formato enriquecido.
5. La ruta moderna usa IDs internos; la compatibilidad completa con IDs legacy queda pendiente de `UserIdentityMap`/mapeos de entidades cuando exista importación controlada.

## Validación ejecutada

- `pnpm exec tsc --noEmit` ✅
- `pnpm exec eslint src/server/forum/service.ts src/app/forum/[instanceId]/page.tsx src/app/forum/[instanceId]/categories/[categoryId]/page.tsx src/app/forum/[instanceId]/topics/[topicId]/page.tsx src/app/api/forum/route.ts` ✅
- `pnpm build` ✅; incluye `/forum/[instanceId]/categories/[categoryId]`.
- `git diff --check` ✅; Windows solo informa la normalización habitual LF/CRLF.
