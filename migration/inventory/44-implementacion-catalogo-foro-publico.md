# Incremento 44 — Catálogo público del foro independiente

## Estado

Implementado un catálogo de lectura pública del foro independiente en Next.js, React, TypeScript, Prisma y PostgreSQL. PHP/MySQL y `docs/legacy` permanecen intactos. No se ejecutó el instalador del plugin, no se importaron filas, usuarios, posts, moderadores, adjuntos, emails ni PII.

El incremento no declara que el plugin Forum esté instalado o activo en la base representada por `docs/se.sql`: el esquema destino se basa en la evidencia del instalador y los controladores documentados en los inventarios 32 y 33.

## Evidencia legacy

La evidencia revisada confirma:

- `docs/legacy/forum.php` y el dispatcher del plugin para índice, subíndice, browse y detalle de temas;
- `docs/legacy/include/forum/controllers/forum_controller.php` para instancias, categorías, temas raíz y paginación;
- `docs/legacy/include/forum/controllers/topic_controller.php` para pertenencia de instancia/categoría/tema, posts y efecto de vistas;
- `docs/legacy/include/forum/lib/models.php` para ACL, moderadores y relaciones lógicas;
- `docs/Forums/admin/install_forum.php` para la estructura candidata de tablas `se_forum_*`;
- `docs/Forums/templates/forum/topic_index.tpl` para el contenido visible de temas y posts.

`docs/se.sql` no confirma tablas `se_forum_*`. Persisten discrepancias documentadas: columnas referenciadas por código que no aparecen en el instalador, serialización de ACL/moderadores y configuración efectiva desconocida.

## Alcance implementado

- índice de instancias con `mode = "forum"`;
- categorías públicas raíz y subcategorías;
- comprobación server-side de que todos los ancestros de una subcategoría son públicos;
- listado paginado de temas raíz, tamaño 10;
- orden estable por anuncio, fijado, fecha y ID;
- detalle paginado del tema y sus respuestas directas;
- comprobación de pertenencia instancia → categoría → tema;
- autor público mínimo, fechas, contadores y flags visuales;
- extractos/cuerpos de respuesta convertidos a texto sin HTML;
- respuestas 404 para recursos inexistentes, no pertenecientes o privados;
- estado vacío explícito en índice, instancia y listados.

El catálogo utiliza únicamente `publicCanRead`. No concede acceso por nivel, subred, categoría de perfil ni moderación porque esas relaciones legacy todavía no tienen contrato de destino verificable. La política es deny-by-default para cualquier contenido no marcado explícitamente como público.

No se implementan creación, edición, borrado, incremento de vistas, bookmarks, ratings, búsqueda FULLTEXT, adjuntos, email, feed, rankings, settings, moderación, ACL autenticada ni administración.

## Trazabilidad legacy → destino

| Legacy | Destino | Estado |
|---|---|---|
| `se_forum_instances.id` | `ForumInstance.legacyId` | Correspondencia preparada; no se importan filas |
| `se_forum_instances.mode` | `ForumInstance.mode` | Solo `forum` entra en el catálogo |
| `se_forum_instances.name` | `ForumInstance.name` | Nombre público opcional |
| `se_forum_instances.text` | `ForumInstance.description` | Descripción; la UI elimina HTML para el extracto |
| `se_forum_instances.position` | `ForumInstance.position` | Orden estable |
| `se_forum_categories.id` | `ForumCategory.legacyId` | Correspondencia preparada |
| `se_forum_categories.instance_id` | `ForumCategory.instanceId` | FK explícita |
| `se_forum_categories.parent_id` | `ForumCategory.parentId` | Jerarquía con `SET NULL` |
| `se_forum_categories.title` | `ForumCategory.title` | Título público |
| `se_forum_categories.text` | `ForumCategory.description` | Descripción opcional |
| `se_forum_categories.position` | `ForumCategory.position` | Orden entre hermanos |
| `se_forum_categories.public_can_read` | `ForumCategory.publicCanRead` | Única ACL habilitada en este incremento |
| `se_forum_categories.is_locked` | `ForumCategory.isLocked` | Estado visual; no se implementan mutaciones |
| `se_forum_posts.id` | `ForumPost.legacyId` | Correspondencia preparada |
| `se_forum_posts.user_id` | `ForumPost.authorId` → `User.id` | Requiere `UserIdentityMap` para importar |
| `se_forum_posts.instance_id` | `ForumPost.instanceId` | FK explícita |
| `se_forum_posts.category_id` | `ForumPost.categoryId` | FK explícita |
| `se_forum_posts.parent_id` | `ForumPost.parentId` | `NULL` = tema raíz; valor = respuesta |
| `se_forum_posts.created` | `ForumPost.createdAt` | `DateTime`; zona y conversión quedan para importador |
| `se_forum_posts.modified` | `ForumPost.modifiedAt` | Fecha opcional |
| `se_forum_posts.title` | `ForumPost.title` | Usado en temas raíz |
| `se_forum_posts.text` | `ForumPost.body` | Solo se muestra texto transformado |
| `se_forum_posts.cache_views` | `ForumPost.views` | Lectura no incrementa el contador en este incremento |
| `se_forum_posts.cache_count_posts` | `ForumPost.replyCount` | Cache recibido; reconciliación pendiente |
| `se_forum_posts.cache_rating` | `ForumPost.rating` | Solo metadato, sin rating |
| `se_forum_posts.is_locked` | `ForumPost.isLocked` | Estado visual |
| `se_forum_posts.is_announcement` | `ForumPost.isAnnouncement` | Orden/presentación |
| `se_forum_posts.is_sticky` | `ForumPost.isSticky` | Orden/presentación |
| `se_forum_posts.has_attachments` | `ForumPost.hasAttachments` | Indicador; no se exponen archivos |
| ACL serializada, moderadores, adjuntos, bookmarks, ratings, email queue | Fuera del primer catálogo | Requieren parser, relaciones y políticas separadas |

## Persistencia

Migración expand-only:

```text
packages/db/prisma/migrations/20260802160000_forum_catalog/migration.sql
```

Modelos:

- `ForumInstance`, `ForumCategory` y `ForumPost` en `packages/db/schema.prisma`;
- `User.forumPostsAuthored`;
- FK de categoría a instancia con `ON DELETE CASCADE`;
- jerarquía de categorías con `ON DELETE SET NULL`;
- autor con `ON DELETE RESTRICT`;
- posts raíz/respuestas mediante self-relation con `ON DELETE CASCADE`;
- índices para modo/posición, jerarquía, ACL pública, categoría, padre y ordenación;
- sin inserts, backfills, drops ni truncates.

La migración fue aplicada a la base PostgreSQL local. No se modificó la base legacy.

## Contratos y rutas

- Dominio: `packages/domain/src/forum.ts`.
- Servicio server-side: `src/server/forum/service.ts`.
- API: `GET /api/forum`.
- Índice: `/forum`.
- Instancia y temas: `/forum/[instanceId]`.
- Tema y posts: `/forum/[instanceId]/topics/[topicId]?categoryId={categoryId}`.

Parámetros API:

```text
instanceId: ID interno opcional
categoryId: ID interno opcional
 topicId: ID interno opcional
page: entero positivo; tamaño server-side 10
```

Cuando se solicita un tema se valida que el `topicId` sea raíz, pertenezca a la instancia y categoría indicadas, y que la categoría sea pública junto con sus ancestros. No se acepta una identidad o permiso enviado por el cliente.

## Efectos secundarios deliberadamente excluidos

El legacy incrementa las vistas al abrir un tema y puede actualizar estados de lectura/notificaciones. Este catálogo no ejecuta efectos secundarios: `views` se presenta como dato persistido y cualquier contador eventual deberá ser un caso de uso separado, idempotente y autorizado.

Tampoco se devuelven HTML/BBCode legacy, rutas de uploads, ACL cruda, serialización de moderadores, emails, licencia o campos dinámicos de perfil.

## Validación ejecutada

- `pnpm prisma validate` ✅
- `pnpm prisma generate` ✅
- `pnpm prisma migrate deploy` ✅; aplicó `20260802160000_forum_catalog`
- `pnpm prisma migrate status` ✅; base local actualizada
- `pnpm exec tsc --noEmit` ✅
- `pnpm exec eslint packages/domain/src/forum.ts src/server/forum/service.ts src/app/api/forum/route.ts src/app/forum/page.tsx src/app/forum/[instanceId]/page.tsx src/app/forum/[instanceId]/topics/[topicId]/page.tsx` ✅
- `pnpm build` ✅; incluye `/forum`, `/api/forum` y las rutas dinámicas de instancia/tema
- `git diff --check` ✅; solo mostró advertencia normal LF/CRLF de Git en Windows

El lint global continúa fuera del criterio de este incremento por errores preexistentes en JavaScript legacy bajo `docs/Forums/include/forum/fckeditor` y `docs/bussiness/include/js`.

## Pendientes y criterios para ampliar

1. Confirmar activación y versión del plugin mediante evidencia no sensible de `se_plugins`.
2. Confirmar el esquema efectivo `se_forum_*` contra una exportación estructural autorizada.
3. Resolver la estrategia de `UserIdentityMap` para autores y moderadores.
4. Normalizar ACL por nivel, subred y categoría de perfil manteniendo semántica OR.
5. Normalizar moderadores por instancia/categoría; nunca autorizar mediante texto serializado.
6. Reconciliar caches de último post, conteos, rating y vistas antes de importar.
7. Definir sanitización robusta para detalle de posts y estrategia de contenido BBCode/HTML.
8. Diseñar adjuntos con validación MIME y storage seguro, sin copiar uploads al repositorio.
9. Separar el incremento idempotente de vistas de la lectura pura si se exige paridad del side effect.
10. Implementar mutaciones, bookmarks, ratings, búsqueda, notificaciones y administración como contratos independientes.
