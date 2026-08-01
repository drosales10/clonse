## Estado

Implementada la compatibilidad de lectura pública del foro con identificadores internos modernos o `legacyId` numéricos positivos. La resolución ocurre en el servidor y normaliza siempre a los IDs internos antes de aplicar relaciones, ACL y consultas de contenido. PHP/MySQL, `docs/legacy` y el esquema Prisma permanecen intactos. No se ejecutaron migraciones, imports, backfills ni operaciones sobre datos reales.

## Evidencia legacy

El dispatcher y los controladores del foro legacy reciben parámetros enteros para la instancia, categoría y topic (`instance_id`, `category_id` y `topic_id`). Las rutas modernas mantienen sus URLs actuales, pero aceptan además esos identificadores legacy cuando existe un `legacyId` correspondiente en `ForumInstance`, `ForumCategory` o `ForumPost`.

La compatibilidad se limita a la lectura pública observable. No se presenta como una implementación completa de todas las rutas AJAX o acciones del plugin Forum.

## Implementación

- `getForumCatalog` resuelve `instanceId` por `ForumInstance.id` o por `ForumInstance.legacyId` positivo.
- La categoría seleccionada se resuelve por `ForumCategory.id` o `ForumCategory.legacyId` positivo.
- `getForumTopic` resuelve instancia, categoría y topic por ID interno o `legacyId` positivo.
- La página `/forum/[instanceId]/categories/[categoryId]` usa el mismo criterio para identificar la categoría que devuelve el servicio.
- Tras resolver una entidad, las consultas de topics, respuestas y relaciones usan los IDs internos canónicos.
- Los enlaces generados por la aplicación siguen usando IDs internos; el `legacyId` es compatibilidad de entrada, no el identificador canónico de navegación.

Un identificador legacy solo se acepta si es una cadena de dígitos cuyo valor es un entero seguro mayor que cero. No se aceptan cero, valores negativos, decimales, valores fuera del rango seguro ni conversiones implícitas arbitrarias.

## Autorización y seguridad preservadas

La resolución por `legacyId` no concede permisos. Después de resolver los IDs se mantienen las comprobaciones existentes:

- la instancia debe estar en modo `forum`;
- la categoría debe pertenecer a la instancia resuelta;
- la categoría y todos sus ancestros deben ser públicos mediante `publicCanRead`;
- el topic debe pertenecer exactamente a la instancia y categoría resueltas;
- solo se muestran topics raíz (`parentId = null`);
- el autor debe estar habilitado;
- las respuestas se consultan por el ID interno del topic ya autorizado.

Los IDs coincidentes en entidades de otra instancia no permiten atravesar la relación: la pertenencia se valida usando el ID interno de la instancia resuelta. La lectura continúa siendo pura; no incrementa vistas, no cambia estados y no ejecuta mutaciones.

## Trazabilidad

| Legacy | Destino | Estado |
|---|---|---|
| parámetros enteros del dispatcher Forum | `instanceId`, `categoryId`, `topicId` de las rutas modernas | Aceptados como `legacyId` positivo |
| identificador interno de instancia | `ForumInstance.id` | Aceptado y usado como forma canónica |
| identificador legacy de instancia | `ForumInstance.legacyId` | Resolución server-side |
| identificador interno de categoría | `ForumCategory.id` | Aceptado y usado para pertenencia/ACL |
| identificador legacy de categoría | `ForumCategory.legacyId` | Resolución server-side |
| identificador interno de post/topic | `ForumPost.id` | Aceptado y usado para respuestas |
| identificador legacy de post/topic | `ForumPost.legacyId` | Resolución server-side |
| pertenencia instancia → categoría → topic | relaciones Prisma | Validada después de normalizar |
| `can_read` y visibilidad heredada | `publicCanRead` + ancestros públicos | Política conservadora disponible en destino |

## Validación ejecutada

- `pnpm exec tsc --noEmit` ✅
- `pnpm exec eslint src/server/forum/service.ts src/app/forum/[instanceId]/categories/[categoryId]/page.tsx src/app/forum/[instanceId]/page.tsx src/app/forum/[instanceId]/topics/[topicId]/page.tsx src/app/api/forum/route.ts` ✅
- `pnpm build` ✅; Prisma Client se generó y Next.js compiló las rutas del foro, incluida la navegación de categoría.
- `git diff --check` ✅; solo se muestran avisos normales de normalización LF/CRLF de Git en Windows.

Estas validaciones son estáticas/de compilación. No se ejecutó una prueba contra una base con datos reales ni se copiaron credenciales, PII o uploads.

## Limitaciones y pendientes

1. No se implementan escrituras de topics, respuestas, edición, adjuntos, bookmarks, ratings, moderación ni acciones AJAX del plugin Forum.
2. No se ha demostrado la ACL completa por nivel, subred, categoría de perfil o moderador porque esos contratos no están modelados de forma verificable en el destino.
3. No se implementan URLs SEO o rutas históricas con otra forma de dispatcher; solo se admite la resolución de los parámetros dentro de las rutas modernas existentes.
4. No se ejecutó importación ni se verificó que los `legacyId` estén poblados en una base destino; la compatibilidad queda lista para datos importados de forma controlada.
5. No se añade migración porque los tres modelos ya contienen `legacyId`.
6. La presentación de HTML/BBCode, vistas, notificaciones y efectos secundarios legacy queda fuera de este incremento.
