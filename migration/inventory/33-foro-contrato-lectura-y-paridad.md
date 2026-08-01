# Incremento 33 — Foro: contrato de lectura y matriz de paridad

## Propósito

Este documento convierte el inventario de esquema y comportamiento del foro independiente en un contrato funcional para el primer vertical de migración: **lectura de instancias, categorías, subcategorías y temas**.

El alcance no incluye todavía creación/edición/borrado, adjuntos, ratings, bookmarks mutables, email, feed, búsqueda PostgreSQL, administración ni migración de datos. El contrato conserva el comportamiento observable del dispatcher y de los controladores legacy, pero no reproduce sus debilidades de seguridad: la futura API debe validar entradas y autorizar en servidor.

Fuentes principales:

- `docs/Forums/forum.php`
- `docs/legacy/forum.php`
- `docs/legacy/include/forum/lib/models.php`
- `docs/legacy/include/forum/controllers/forum_controller.php`
- `docs/legacy/include/forum/controllers/topic_controller.php`
- `docs/Forums/templates/forum/topic_index.tpl`
- `migration/inventory/32-foro-esquema-y-catalogo.md`

## Actores y superficies

| Actor | Puede hacer en este incremento | Restricciones |
|---|---|---|
| Visitante anónimo | Ver índice, categorías/subcategorías y temas autorizados como públicos | No ve categorías privadas; no accede a búsquedas, bookmarks, posts propios ni settings |
| Usuario autenticado | Todo lo público autorizado; ver sus bookmarks y posts propios en la superficie legacy | Nivel, subred, categoría de perfil y bloqueos de categoría determinan acceso |
| Moderador de instancia/categoría | Ver contenidos de su ámbito aunque la ACL pública no coincida | La moderación se resolverá por relación normalizada en destino, no por texto serializado |
| Administrador legacy | Configurar instancias, categorías, ACL, rankings y settings | Fuera de la primera API pública; requiere superficie administrativa separada |
| Sistema de sesión | Aporta `userId`, `levelId`, `subnetId`, `profileCategoryId` y estado autenticado | Nunca se acepta identidad o permisos enviados por el cliente |

El usuario autenticado no es automáticamente moderador. La moderación se comprueba contra instancia, categoría raíz y subcategoría.

## Frontera del catálogo de lectura

### Incluido

1. Índice de una instancia de foro.
2. Listado de categorías raíz y subcategorías visibles.
3. Listado paginado de temas recientes.
4. Detalle paginado de un tema y sus posts visibles.
5. Metadatos públicos mínimos de autor, fecha, contadores y estado visual.
6. Resolución de permisos de lectura antes de cargar o devolver contenido.
7. Traducción de errores legacy a una respuesta moderna que no revele si un recurso privado existe.

### Excluido

- creación de temas o respuestas;
- edición y borrado;
- subida y descarga de archivos;
- alta/baja de bookmarks;
- rating;
- búsqueda FULLTEXT;
- envío o cola de correos;
- acciones de feed;
- settings de usuario;
- rankings e imágenes como integración de storage;
- administración y modificación de ACL;
- migración/importación de datos reales.

## Rutas legacy y contrato de destino

El dispatcher acepta URL estándar y mod_rewrite. Los identificadores legacy son `iid` para instancia, `cid` para categoría, `tid` para tema, `pid` para post, `page` para página y `aid` para adjunto. `op` selecciona acción y `c` selecciona controlador.

| Comportamiento legacy | Entrada observada | Contrato destino propuesto | Actor |
|---|---|---|---|
| Índice | `forum.php?c=forum&op=index&iid={instanceId}` | `GET /api/forum/instances/{instanceId}` | Público |
| Categorías/subcategorías | `c=forum&op=subindex&iid=&cid=` | `GET /api/forum/instances/{instanceId}/categories/{categoryId}` | Público según ACL |
| Temas recientes | `c=forum&op=browse&iid=&page=` | `GET /api/forum/instances/{instanceId}/topics?page=` | Público según ACL |
| Tema y posts | `c=topic&op=index&iid=&cid=&tid=&page=` | `GET /api/forum/instances/{instanceId}/categories/{categoryId}/topics/{topicId}?page=` | Público según ACL |
| Bookmarks | `c=forum&op=bookmarks&iid=&page=` | Fuera del primer catálogo; futuro `GET` autenticado | Autenticado |
| Posts propios | `c=forum&op=my_posts&iid=&page=` | Fuera del primer catálogo; futuro `GET` autenticado | Autenticado |
| Búsqueda | `c=forum&op=search&iid=` + POST | Fuera del primer catálogo; futuro contrato independiente | Autenticado |
| SEO topic | `/forum/.../{topicId}-{page}.html` | Redirección o resolución controlada a URL moderna | Público según ACL |

Los nombres `/api` son una propuesta de transporte, no una implementación existente. No deben confundirse con una afirmación de que el legacy dispone de REST.

## Entrada y validación

### Índice de instancia

```text
instanceId: entero positivo
viewer: sesión opcional, obtenida server-side
```

Reglas:

1. Normalizar `instanceId` como entero positivo.
2. Resolver la instancia por `id` y exigir `mode = forum`.
3. Si no existe o pertenece a otro modo, responder como recurso no disponible.
4. Cargar únicamente categorías raíz y sus subcategorías visibles.
5. Ordenar por `position ASC`, con desempate estable por ID.
6. No aceptar nombres de columna, filtros SQL ni ACL desde el cliente.

### Listado de temas

```text
instanceId: entero positivo
page: entero positivo, default 1
pageSize: controlado por servidor; default legacy observado 10
```

Reglas:

1. Resolver la instancia y las subcategorías de esa instancia.
2. Aplicar `can_read` considerando instancia, categoría raíz, subcategoría y viewer.
3. Seleccionar solo posts raíz (`parentId IS NULL`).
4. Ordenar por `lastPostAt` derivado del cache legacy, con fallback controlado a `createdAt`.
5. Aplicar paginación estable y límites máximos server-side.
6. No permitir que `pageSize`, orden o filtros sustituyan la ACL.
7. No devolver temas de una instancia distinta aunque el ID exista.

### Detalle de tema

```text
instanceId: entero positivo
categoryId: entero positivo
topicId: entero positivo
page: entero positivo, default 1
```

Reglas:

1. Resolver instancia, subcategoría y categoría padre.
2. Comprobar que la subcategoría pertenece a la instancia y al padre indicado.
3. Comprobar que `topicId` es un post raíz de esa categoría.
4. Aplicar lectura sobre padre y subcategoría antes de devolver posts.
5. Cargar el post raíz y sus respuestas directas ordenadas por `created ASC`.
6. Mantener paginación por posts.
7. Exponer adjuntos solo como metadato autorizado en una fase posterior; no entregar rutas de storage en este incremento.

## Reglas de autorización

### Lectura de categoría

La decisión equivalente a `SEP_Forum_Models::can_read` es:

```text
allow = isModerator(viewer, instance, parentCategory, category)
     OR (viewer.isGuest AND category.publicCanRead)
     OR (viewer.isAuthenticated AND (
          viewer.levelId IN category.readLevelIds
       OR viewer.subnetId IN category.readSubnetIds
       OR viewer.profileCategoryId IN category.readProfileCategoryIds
     ))
```

La combinación de nivel, subred y categoría de perfil es OR, no AND. Un invitado no se beneficia de listas destinadas a usuarios autenticados. Un moderador conserva lectura aunque no coincida la ACL ordinaria.

### Bloqueos

`isLocked` no impide leer; impide escribir salvo para moderadores. El catálogo debe devolver el estado visual de bloqueo solo si la UI lo necesita, sin convertirlo en permiso de mutación.

### Privacidad del autor y contenido

La lectura del foro no debe exponer automáticamente email, nombre legal, campos de perfil arbitrarios, firma, rutas internas de uploads ni caches privados. El legacy puede cargar campos adicionales mediante `include_from_profile`; ese comportamiento queda fuera del DTO público hasta definir una allowlist por instancia y una política de privacidad.

## Salida contractual

### Instancia

```ts
interface ForumInstanceSummary {
  id: string;
  legacyId: number;
  name: string | null;
  description: string | null;
  position: number;
}
```

`id` representa el identificador público moderno; `legacyId` solo se expone si la estrategia de compatibilidad lo permite. La respuesta no incluye moderadores serializados, licencia ni settings internos.

### Categoría

```ts
interface ForumCategorySummary {
  id: string;
  legacyId: number;
  parentId: string | null;
  title: string | null;
  description: string | null;
  position: number | null;
  isLocked: boolean;
  visibleTopicCount: number | null;
  visiblePostCount: number | null;
  lastPost: {
    createdAt: string;
    topicId: string | null;
    displayName: string | null;
  } | null;
}
```

Los contadores y `lastPost` son caches legacy: deben marcarse como derivados o reconciliados. No se deben presentar como exactos hasta comprobar su consistencia.

### Tema

```ts
interface ForumTopicSummary {
  id: string;
  legacyId: number;
  categoryId: string;
  title: string | null;
  author: PublicForumAuthor;
  createdAt: string;
  lastPostAt: string | null;
  lastPostAuthor: PublicForumAuthor | null;
  replyCount: number | null;
  viewCount: number | null;
  rating: number | null;
  isLocked: boolean;
  isAnnouncement: boolean;
  isSticky: boolean;
  hasAttachments: boolean;
}
```

### Post visible

```ts
interface ForumPost {
  id: string;
  legacyId: number;
  topicId: string;
  author: PublicForumAuthor;
  createdAt: string;
  modifiedAt: string | null;
  body: string;
  isLocked: boolean;
  hasAttachments: boolean;
}

interface PublicForumAuthor {
  userId: string;
  username: string;
  displayName: string | null;
  avatarRef: string | null;
}
```

`body` requiere sanitización en destino. El contrato no autoriza HTML/BBCode legacy sin procesar. `avatarRef` debe ser una referencia controlada por el adaptador de media, nunca una ruta construida con input del usuario.

## Efectos secundarios del legacy y tratamiento destino

| Efecto observado | Acción legacy | Tratamiento del catálogo moderno |
|---|---|---|
| Incremento de vistas | `topic_controller.index` incrementa `cache_views` | Decidir explícitamente: comando separado, evento idempotente o contador eventual; no ocultarlo en una lectura si se exige pureza |
| Actualización de “leído” | `set_topic_id_is_read` actualiza estado de sesión/lectura | Fuera del primer DTO; diseñar como caso autenticado separado |
| Limpieza de notificaciones | Ocurre en otros detalles del foro | Fuera del catálogo público; no ejecutarla sin contrato de notificaciones |
| Resolución de perfil | `include_from_profile` puede cargar campos dinámicos | Allowlist server-side; por ahora omitir campos adicionales |
| Caches | Categorías y temas muestran contadores/cache de último post | Leer como datos derivados; reconciliar en backfill o consulta consistente |
| Feed/email | Solo mutaciones los generan | No ejecutar en lectura |

El incremento de vistas es la única mutación observada directamente al abrir un tema. Para paridad estricta deberá compararse su existencia y momento; para diseño de dominio se recomienda no mezclarlo con la consulta principal sin una decisión explícita.

## Errores y respuestas

El legacy redirige a páginas de error para instancia, categoría, tema, URL, licencia, plugin deshabilitado o ausencia de foros. El contrato destino debe preservar el resultado observable —recurso no disponible y no filtración de existencia— sin copiar HTML de error.

| Condición | Resultado legacy | Resultado destino |
|---|---|---|
| `instanceId` inválido/no positivo | URL inválida o instancia no encontrada | `400 INVALID_INPUT` para formato; `404 FORUM_NOT_FOUND` para ID válido inexistente |
| No hay instancias `mode=forum` | Error “There are no forums to access” | `404 FORUM_NOT_FOUND` o estado de módulo no disponible, según configuración |
| Instancia de modo distinto | Puede ocultarse como foro inválido | `404 FORUM_NOT_FOUND` |
| Plugin deshabilitado | Error de foro no disponible | `404 FORUM_NOT_AVAILABLE` o feature flag server-side; no revelar licencia/configuración |
| Licencia ausente legacy | Error de foro no disponible | No transportar licencia; `404/503` según política operativa |
| Categoría/tópico no pertenece a instancia | Error de recurso inválido | `404 RESOURCE_NOT_FOUND` |
| Recurso privado para viewer | Error indistinguible en navegación | `404 RESOURCE_NOT_FOUND` para evitar enumeración |
| Página no válida | Paginación/error según helper | Normalizar a `400 INVALID_PAGE` o página vacía, decisión pendiente de compatibilidad |
| Error interno de DB/storage | Warning/log o pantalla genérica legacy | `500 INTERNAL_ERROR`, log sin PII ni contenido |

Los códigos son contrato de aplicación propuesto. La equivalencia se validará en pruebas controladas contra redirecciones y mensajes legacy, sin copiar secretos ni datos.

## Matriz de paridad y evidencia

| Caso | Actor | Fuente legacy | Regla observable | Evidencia requerida | Estado |
|---|---|---|---|---|---|
| Abrir índice de instancia válida | Visitante/usuario | `forum.php`, `forum_controller.index` | Devuelve categorías raíz de la instancia | Fixture sintético + respuesta comparada | Inventariado; pendiente prueba |
| Instancia inexistente | Cualquiera | dispatcher/controller | Error sin contenido | Caso controlado, status/redirección | Inventariado; pendiente prueba |
| Instancia `mode != forum` | Cualquiera | `forum.php` | No se muestra como foro | Fixture con modo distinto | Inventariado; pendiente prueba |
| Sin instancias de foro | Cualquiera | `forum.php` | Foro no disponible | Configuración aislada | Inventariado; pendiente prueba |
| Categoría pública para invitado | Invitado | `can_read`, `subindex` | Visible si `public_can_read=1` | Matriz ACL con fixture | Inventariado; pendiente prueba |
| Categoría privada para invitado | Invitado | `can_read` | Oculta | Matriz ACL con fixture | Inventariado; pendiente prueba |
| ACL por nivel | Usuario | `can_read` | Visible si coincide `level_id` | Usuarios sintéticos por nivel | Inventariado; pendiente prueba |
| ACL por subred | Usuario | `can_read` | Visible si coincide `subnet_id` | Usuarios sintéticos por subred | Inventariado; pendiente prueba |
| ACL por categoría de perfil | Usuario | `can_read` | Visible si coincide `profilecat_id` | Usuarios sintéticos por profilecat | Inventariado; pendiente prueba |
| Moderador fuera de ACL | Moderador | `is_moderator`, `can_read` | Puede leer | Relación de moderación sintética | Inventariado; pendiente prueba |
| Listado de temas | Público autorizado | `forum_controller.browse` | Solo posts raíz, orden por última actividad | Dataset de temas/respuestas | Inventariado; pendiente prueba |
| Tema de otra categoría | Cualquiera | `topic_controller.index` | No accesible | IDs cruzados en fixture | Inventariado; pendiente prueba |
| Paginación de temas | Cualquiera autorizado | `mysql_pagination` | Tamaño y orden estables | Dataset mayor que una página | Inventariado; pendiente prueba |
| Detalle con respuestas | Público autorizado | `topic_controller.index` | Raíz + respuestas ordenadas | Dataset sintético | Inventariado; pendiente prueba |
| Tema privado | Visitante/usuario no autorizado | `can_read` | No revela existencia | Comparación 404/error | Inventariado; pendiente prueba |
| Incremento de vistas | Visitante autorizado | `topic_controller.index` | `cache_views` aumenta al abrir | Prueba aislada de side effect | Inventariado; pendiente prueba |
| Usuario autenticado sin bookmarks | Usuario | `forum_controller.bookmarks` | Requiere sesión; fuera del primer incremento | Prueba futura | Fuera de alcance |
| Búsqueda sin sesión | Visitante | `forum_controller.search` | Requiere autorización | Prueba futura | Fuera de alcance |
| Tema bloqueado | Usuario/Moderador | `can_read`, `can_write` | Lectura permitida; escritura futura restringida | Prueba de lectura + mutación posterior | Lectura inventariada |
| Datos de autor | Público autorizado | `topic_index.tpl` | Username/display/avatar visibles según política | DTO y privacidad | Pendiente decisión pública |
| Adjuntos | Usuario | `topic_controller.index`, plantilla | Visible en UI autenticada | Storage sintético y autorización | Fuera de alcance |

## Criterios de aceptación del contrato

El catálogo podrá pasar a diseño de dominio/API cuando exista evidencia controlada de que:

1. un visitante ve únicamente instancia, categorías, subcategorías y temas con `public_can_read`;
2. un usuario autenticado obtiene exactamente el OR de nivel/subred/profilecat observado;
3. un moderador válido puede leer su ámbito aunque la ACL no coincida;
4. una categoría o tema perteneciente a otra instancia no se filtra por IDs manipulados;
5. los temas raíz y respuestas se separan mediante `parentId` con orden y paginación equivalentes;
6. los recursos privados producen una respuesta indistinguible de inexistencia;
7. ningún DTO expone moderadores serializados, ACL cruda, licencia, emails, rutas internas o contenido no sanitizado;
8. el side effect de vistas está decidido, medido y probado, o explícitamente separado del caso de lectura;
9. los caches se tratan como derivados y no como fuente incuestionable de verdad;
10. se documentan las diferencias inevitables entre redirect/Smarty legacy y respuesta Next.js.

## Handoff a dominio, Prisma y UI

### Dominio

Crear posteriormente casos de uso independientes del transporte:

- `GetForumInstanceCatalog`;
- `GetForumCategory`;
- `ListForumTopics`;
- `GetForumTopic`;
- `EvaluateForumReadAccess`.

La autorización debe recibir un contexto de viewer y relaciones ya resueltas; no depender de componentes React ni de una cookie sin validar.

### Prisma/DB

Antes de modelar se necesitan:

- estrategia de `legacyId` y relación con `User`;
- parser y tablas para ACL y moderadores normalizados;
- decisión sobre caches materializados frente a consultas derivadas;
- confirmación de `has_news_feed_support` y `topic_has_attachments` contra esquema efectivo;
- política UTC para `datetime`;
- búsqueda y ranking fuera del primer catálogo.

No se modifica `packages/db/schema.prisma` en este incremento.

### API/UI

La futura UI puede usar Server Components para índice/categorías/temas y Client Components únicamente para paginación o acciones interactivas. Los Route Handlers deberán validar IDs, página y sesión en servidor. La vista no debe mostrar enlaces de edición, rating, bookmarks o respuesta como si estuvieran implementados hasta cerrar sus contratos.

## Decisión

El contrato de lectura del foro queda documentado y suficientemente delimitado para iniciar el diseño de dominio, pero no se declara implementado ni equivalente. El siguiente paso técnico es preparar fixtures sintéticos y una matriz ejecutable de autorización, o cerrar primero la estrategia compartida de usuarios/ACL/IDs. No se necesitan más archivos del plugin para redactar este contrato; sí se necesita evidencia estructural/configuración efectiva antes de importar datos o crear migraciones Prisma.
