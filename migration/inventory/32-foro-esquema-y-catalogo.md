# Incremento 32 — Foro independiente: esquema y catálogo

## Resultado y alcance

El directorio `docs/Forums` contiene una distribución funcional del **Forum Plugin 3.01** para SocialEngine 3, incluyendo instalador, controladores, modelos, plantillas, administración, recursos gráficos, localización y almacenamiento de adjuntos. El archivo `docs/Forums/admin/install_forum.php` confirma la definición de 11 tablas `se_forum_*`.

El esquema queda **confirmado por el instalador del plugin**, pero no por el dump activo `docs/se.sql`: una búsqueda de bloques `CREATE TABLE` para `se_forum_` no produjo resultados. Por tanto, todavía no se afirma que el foro esté instalado o activo en la base representada por el dump. La activación efectiva requiere verificar `se_plugins` y la existencia de tablas en una instancia controlada, sin modificarla.

No se ejecutó el instalador, no se consultó una base de datos y no se leyeron ni copiaron `INSERT`, correos, credenciales, uploads o datos de usuarios.

## Evidencia inspeccionada

- `docs/Forums/admin/install_forum.php`
- `docs/Forums/forum.php`
- `docs/Forums/header_forum.php`
- `docs/Forums/footer_forum.php`
- `docs/Forums/templates/forum/topic_index.tpl`
- `docs/legacy/include/forum/lib/models.php`
- `docs/legacy/include/forum/controllers/forum_controller.php`
- `docs/legacy/include/forum/controllers/topic_controller.php`
- controladores legacy de categoría y post bajo `docs/legacy/include/forum/controllers/`
- `docs/se.sql`, únicamente para comprobar ausencia de `CREATE TABLE se_forum_*`

La distribución contiene además `admin/`, `include/`, `locale/`, `templates/`, `images/` y `uploads_forum/`. La existencia de estos archivos no prueba por sí sola que el plugin esté instalado, configurado o habilitado.

## Instalador y ciclo de vida legacy

El instalador registra:

- nombre: `Forum Plugin`;
- versión: `3.01`;
- tipo: `forum`;
- páginas administrativas de settings, instancias, modificaciones y ayuda;
- acciones de feed para nuevo tema y nueva respuesta;
- idioma y menú del foro.

Soporta instalación fresca, actualización desde el foro antiguo `iforum` y actualización desde versiones anteriores del plugin. El camino de actualización desde `iforum` transforma categorías, subcategorías, temas, respuestas y contadores; también contempla archivos antiguos y tablas `se_iforum_*`. Ese bloque no debe ejecutarse durante la migración destino porque incluye borrados, inserciones y modificaciones de la base legacy.

En instalación fresca crea tablas MyISAM con charset `utf8`, registra la instancia inicial y escribe valores iniciales de configuración. Esos valores son defaults del instalador, no evidencia de la configuración efectiva del sitio.

## Esquema confirmado por `install_forum.php`

Todas las tablas siguientes usan `ENGINE=MyISAM DEFAULT CHARSET=utf8`. Los índices declarados como `KEY fk_*` son índices ordinarios: MyISAM no impone foreign keys. Las referencias indicadas son relaciones lógicas observadas en el código.

### `se_forum_attachments`

| Columna | Tipo/default | Observación |
|---|---|---|
| `id` | `int(10) unsigned`, autoincremental, not null | PK declarada compuesta con `post_id` y `user_id` |
| `post_id` | `int(10) unsigned`, not null | Post al que pertenece; índice `post_id` |
| `user_id` | `int(9) unsigned`, not null | Usuario que subió el archivo |
| `created` | `datetime`, not null | Fecha SQL, no Unix timestamp |
| `filename` | `varchar(255)`, not null | Nombre almacenado/visible según flujo |
| `mimetype` | `varchar(30)`, not null | El código también lo usa para decidir presentación |
| `cache_downloads` | `mediumint(5) unsigned`, default `0` | Contador |
| `text` | `varchar(255)`, nullable | Descripción del adjunto |
| `is_deleted` | `tinyint(1) unsigned`, default `0` | Borrado lógico |

Unique `post_id_filename(post_id, filename)` e índice lógico hacia posts.

### `se_forum_bookmarks`

| Columna | Tipo/default | Observación |
|---|---|---|
| `user_id` | `int(9) unsigned`, not null | Usuario propietario del bookmark |
| `post_id` | `int(10) unsigned`, not null | En la práctica identifica el tema guardado |
| `created` | `datetime`, not null | Fecha SQL |

PK compuesta `(user_id, post_id)` e índice sobre `post_id`. El código inserta evitando errores si el bookmark ya existe.

### `se_forum_categories`

| Columna | Tipo/default | Observación |
|---|---|---|
| `id` | `int(10) unsigned`, autoincremental, not null | PK |
| `instance_id` | `int(10) unsigned`, not null | Instancia del foro |
| `parent_id` | `int(10) unsigned`, nullable | Jerarquía: raíz o subcategoría |
| `created` | `datetime`, nullable | Fecha SQL |
| `title` | `varchar(200)`, nullable | Título |
| `text` | `text`, nullable | Descripción |
| `cache_last_post_created` | `datetime`, nullable | Cache de última actividad |
| `cache_last_post_id` | `int(10) unsigned`, nullable | Cache |
| `cache_last_post_title` | `varchar(255)`, nullable | Cache |
| `cache_last_post_user_id` | `int(9) unsigned`, nullable | Cache |
| `cache_last_post_user_name` | `varchar(50)`, nullable | Cache |
| `cache_last_post_display_name` | `varchar(200)`, nullable | Cache |
| `cache_last_post_user_photo` | `varchar(10)`, nullable | Cache de avatar |
| `cache_count_topics` | `int(10) unsigned`, default `0` | Cache |
| `cache_count_posts` | `int(10) unsigned`, default `0` | Cache |
| `public_can_read` | `tinyint(1) unsigned`, default `0` | Lectura de invitados |
| `user_level_can_read` | `text`, nullable | Lista de IDs separada por comas |
| `user_level_can_write` | `text`, nullable | Lista de IDs separada por comas |
| `user_subnet_can_read` | `text`, nullable | Lista de IDs separada por comas |
| `user_subnet_can_write` | `text`, nullable | Lista de IDs separada por comas |
| `user_profilecat_can_read` | `text`, nullable | Lista de IDs separada por comas |
| `user_profilecat_can_write` | `text`, nullable | Lista de IDs separada por comas |
| `moderators` | `text`, nullable | Lista serializada de moderadores |
| `position` | `int(10) unsigned`, nullable | Orden entre hermanos |
| `is_locked` | `tinyint(1) unsigned`, default `0` | Bloqueo de categoría |

PK `id`; índices lógicos sobre `instance_id` y `parent_id`. El código también selecciona `has_news_feed_support`, pero esa columna **no aparece en el CREATE TABLE del instalador**. Debe tratarse como discrepancia de versión o esquema efectivo pendiente de verificar; no se debe crear en Prisma sin evidencia adicional.

### `se_forum_email_queue`

| Columna | Tipo/default | Observación |
|---|---|---|
| `id` | `int(10) unsigned`, autoincremental, not null | PK |
| `created` | `datetime`, not null | Fecha de encolado |
| `priority` | `tinyint(1) unsigned`, default `0` | Prioridad |
| `email` | `varchar(100)`, not null | Destinatario; campo sensible |
| `subject` | `varchar(255)`, not null | Asunto generado |
| `body` | `text`, not null | Mensaje generado; puede contener PII y contenido de usuario |

No migrar contenido de esta tabla en fixtures o documentación. En destino debe aplicarse una política de retención y protección de datos.

### `se_forum_instances`

| Columna | Tipo/default | Observación |
|---|---|---|
| `id` | `int(10) unsigned`, autoincremental, not null | PK |
| `created` | `datetime`, not null | Fecha SQL |
| `mode` | `varchar(20)`, not null | Índice `mode`; el instalador inicial usa modo `forum` |
| `name` | `varchar(255)`, nullable | Nombre visible |
| `text` | `text`, nullable | Descripción |
| `moderators` | `text`, nullable | Lista serializada de moderadores |
| `attachments_mimetypes` | `varchar(255)`, default `.jpg, .jpeg, .zip` | Allowlist legacy |
| `attachments_maxfilesize` | `smallint(5) unsigned`, nullable | Límite configurado |
| `attachments_image_max_width` | `smallint(4) unsigned`, default `300` | Redimensionado |
| `attachments_image_max_height` | `smallint(4) unsigned`, default `300` | Redimensionado |
| `attachments_image_quality` | `tinyint(2) unsigned`, default `75` | Calidad de imagen |
| `attachments_image_resize` | `tinyint(1) unsigned`, default `1` | Flag |
| `allow_emoticons` | `tinyint(1) unsigned`, default `1` | Flag de UI/procesado |
| `position` | `int(10) unsigned`, default `0`, nullable | Orden |
| `include_from_profile` | `text`, nullable | Plantillas de campos de usuario/perfil |

### `se_forum_posts`

Un registro raíz (`parent_id IS NULL`) representa un tema; un registro con `parent_id` representa una respuesta. No existe una tabla separada `Topic` en el instalador: el modelo lógico `Post` cumple ambas funciones.

| Columna | Tipo/default | Observación |
|---|---|---|
| `id` | `int(10) unsigned`, autoincremental, not null | PK declarada compuesta con `user_id` |
| `user_id` | `int(9) unsigned`, not null | Autor lógico hacia `se_users` |
| `instance_id` | `int(10) unsigned`, not null | Instancia |
| `category_id` | `int(10) unsigned`, not null | Subcategoría |
| `parent_id` | `int(10) unsigned`, nullable | Tema padre para respuestas |
| `created` | `datetime`, not null | Fecha SQL |
| `modified` | `datetime`, nullable | Última edición |
| `title` | `varchar(255)`, nullable | Normalmente en tema raíz |
| `text` | `text`, nullable | Cuerpo; admite formato legacy/BBCode/HTML procesado |
| `cache_user_name` | `varchar(50)`, not null | Cache de autor |
| `cache_display_name` | `varchar(200)`, nullable | Cache de autor |
| `cache_last_post_created` | `datetime`, nullable | Cache del tema raíz |
| `cache_last_post_id` | `int(10) unsigned`, nullable | Cache |
| `cache_last_post_user_id` | `int(9) unsigned`, nullable | Cache |
| `cache_last_post_user_name` | `varchar(50)`, nullable | Cache |
| `cache_last_post_display_name` | `varchar(200)`, nullable | Cache |
| `cache_last_post_user_photo` | `varchar(10)`, nullable | Cache |
| `cache_count_posts` | `int(10) unsigned`, default `0` | Respuestas del tema |
| `cache_rating` | `tinyint(2)`, default `-1` | Promedio/cache de rating |
| `cache_views` | `mediumint(5) unsigned`, default `0` | Se incrementa al leer el tema |
| `is_locked` | `tinyint(1) unsigned`, default `0` | Bloqueo |
| `is_announcement` | `tinyint(1) unsigned`, default `0` | Anuncio |
| `is_sticky` | `tinyint(1) unsigned`, default `0` | Fijado |
| `has_attachments` | `tinyint(1) unsigned`, default `0` | Indicador de adjuntos |

PK declarada `(id, user_id)` e índices sobre instancia, categoría, padre, flags, rating y última actividad. Tiene FULLTEXT sobre `text`. El código contiene una referencia a `topic_has_attachments` al actualizar un tema, pero esa columna no está en el instalador; es otra discrepancia que requiere resolver contra la instalación efectiva.

### `se_forum_rankings`

| Columna | Tipo/default | Observación |
|---|---|---|
| `id` | `int(10) unsigned`, autoincremental, not null | PK |
| `instance_id` | `int(10) unsigned`, nullable | Instancia |
| `minimum_posts` | `int(10) unsigned`, nullable | Umbral combinado de temas/posts |
| `image` | `varchar(255)`, nullable | Archivo de insignia |
| `name` | `varchar(200)`, nullable | Nombre visible |

Índice lógico sobre `instance_id`. Las imágenes se almacenan bajo `uploads_forum/rankings/` y el administrador valida extensión/tamaño antes de redimensionarlas, aunque la migración destino debe aplicar validación MIME real y almacenamiento seguro.

### `se_forum_ratings`

| Columna | Tipo/default | Observación |
|---|---|---|
| `user_id` | `int(9) unsigned`, not null | Usuario que califica |
| `post_id` | `int(10) unsigned`, not null | Tema calificado |
| `created` | `datetime`, not null | Fecha SQL |
| `rating` | `tinyint(2) unsigned`, not null | El código acepta valores 0–4 y evita repetir usuario/tema |

PK compuesta `(user_id, post_id)` e índice sobre `post_id`. El promedio se escribe en `Post.cache_rating`.

### `se_forum_settings`

| Columna | Tipo/default | Observación |
|---|---|---|
| `id` | `varchar(30)`, not null | PK de clave de configuración |
| `value` | `text`, nullable | Valor polimórfico/serializado como texto |

El modelo consulta claves de paginación, URLs, menú, cola de email y otros ajustes. No se deben copiar valores reales ni la licencia. Para Prisma conviene un repositorio tipado por clave con validación, no acceso libre desde la UI.

### `se_forum_user_instance_settings`

| Columna | Tipo/default | Observación |
|---|---|---|
| `user_id` | `int(10) unsigned`, not null | Usuario |
| `instance_id` | `int(10) unsigned`, default `0`, not null | Instancia |
| `cache_count_posts` | `int(10) unsigned`, default `0`, not null | Contador por instancia |
| `cache_count_topics` | `int(10) unsigned`, default `0`, not null | Contador por instancia |
| `ranking_id` | `int(10) unsigned`, nullable | Ranking calculado |

PK `(user_id, instance_id)` e índices lógicos sobre instancia y ranking. Los contadores se actualizan al crear respuestas/temas y alimentan el ranking.

### `se_forum_user_settings`

| Columna | Tipo/default | Observación |
|---|---|---|
| `user_id` | `int(9) unsigned`, not null | PK y relación lógica con usuario |
| `signature` | `text`, nullable | Firma mostrada en posts |
| `notify_bookmark` | `tinyint(1) unsigned`, default `0` | Email ante respuesta a bookmark |
| `notify_my_topics` | `tinyint(1) unsigned`, default `0` | Email ante respuesta a tema propio |

## Relaciones y tipos temporales

Relaciones lógicas principales:

- `Instance 1:N Category` mediante `instance_id`.
- `Category 1:N Category` mediante `parent_id`.
- `Instance 1:N Post` mediante `instance_id`.
- `Category 1:N Post` mediante `category_id`.
- `Post 1:N Post` mediante `parent_id`.
- `Post 1:N Attachment`, `Bookmark`, `Rating` mediante `post_id`.
- `Instance 1:N Ranking` y `UserInstanceSetting` mediante `instance_id`.
- `Ranking 1:N UserInstanceSetting` mediante `ranking_id`.
- tablas de usuario mediante `user_id` hacia `se_users`.

El instalador no declara foreign keys reales. Prisma destino sí debe declarar relaciones y restricciones, pero la importación debe ordenar y validar referencias para no perder filas huérfanas legacy.

Las fechas de las 11 tablas son `datetime` SQL salvo que no exista fecha en una tabla. No deben confundirse con los timestamps Unix de grupos u otras tablas SocialEngine. El upgrade desde `iforum` convierte timestamps Unix a `Y-m-d H:i:s` mediante `int_time_to_string`; el destino debe documentar zona horaria y valores vacíos antes de importar.

## Serialización legacy

### ACL

Los seis campos `user_*_can_read/write` de categoría se guardan como texto con IDs separados por comas. `acl_encode()` usa `implode(',', $array)` y `acl_decode()` separa por comas y aplica `trim`. El código combina las reglas con **OR**: basta coincidir por nivel, subred o categoría de perfil.

No deben convertirse automáticamente en JSON sin conservar la semántica y los IDs legacy. Para el destino se recomienda normalizar a tablas de asignación por categoría, permiso y dimensión, manteniendo un transformador reversible o un campo de auditoría durante la migración.

### Moderadores

`moderators` en instancia y categorías usa un formato custom, por ejemplo conceptualmente `user_id: "username<!>displayname"`, con múltiples entradas separadas por comas. `moderator_encode()` y `moderator_decode()` son los únicos contratos observados. El nombre y display name son caches; el identificador de usuario es la autoridad.

En Prisma conviene una relación `ForumModerator` con `scope` (`instance` o `category`), `userId` y opcionalmente los snapshots de nombre solo si se necesitan para compatibilidad histórica. No usar el texto serializado como autorización en la nueva aplicación.

### Settings y campos de perfil

`se_forum_settings.value` es texto polimórfico. `include_from_profile` contiene placeholders como `{user_*}` y `{profilevalue_*}` para construir información adicional en la vista. El controlador puede leer opciones serializadas de campos de perfil con `unserialize`; esa serialización PHP no debe ejecutarse sin aislamiento ni copiarse directamente a PostgreSQL.

## Autorización y estados observables

### Lectura

`can_read` sigue este orden:

1. un moderador de instancia, categoría raíz o subcategoría puede leer;
2. un invitado puede leer si `public_can_read=1`;
3. un invitado no puede leer una categoría privada;
4. un usuario autenticado puede leer si su `level_id`, `subnet_id` o `profilecat_id` aparece en la lista correspondiente;
5. si no coincide ninguna regla, se deniega.

Las páginas de foro, subcategoría, búsqueda y tema aplican la lectura antes de devolver categorías o posts. Un tema siempre se valida contra instancia, categoría, categoría padre y ACL; no basta conocer el ID del post.

### Escritura

`can_write` exige sesión autenticada. Los moderadores pueden escribir incluso cuando la categoría está bloqueada. En otro caso deben cumplirse simultáneamente:

- categoría padre no bloqueada;
- subcategoría no bloqueada;
- tema no bloqueado cuando se responde;
- coincidencia por nivel, subred o categoría de perfil en las listas `*_can_write`.

La creación de respuesta exige texto no vacío. El código aplica censura, actualiza contadores y caches, puede publicar una acción de feed, mueve adjuntos temporales y encola notificaciones de email.

### Edición y borrado

- `can_edit`: requiere sesión; un moderador de cualquier ámbito puede editar; el propietario puede editar mientras no haya locks; los locks de padre, categoría o post impiden la edición del propietario.
- `can_delete`: requiere sesión y moderación de instancia, padre o subcategoría; el propietario no obtiene borrado por esta función.
- La UI muestra edición al propietario o moderador, pero el control server-side es la autoridad.
- El borrado de categoría/post toca posts, bookmarks, ratings y marca adjuntos; las operaciones MyISAM no son atómicas y deben ser transacciones en destino.

### Bookmarks y ratings

Bookmarks requieren autenticación y lectura autorizada del tema. La unicidad es `(user_id, post_id)`. Ratings requieren autenticación y permiso de escritura; el código restringe la escala a 0–4 y permite una valoración por usuario/tema. El promedio se recalcula y se guarda como cache.

### Lock y orden

Las categorías raíz y subcategorías tienen `position`; el controlador puede reordenarlas y resincronizar posiciones. `is_locked` se hereda en las comprobaciones de escritura. Los posts raíz usan `is_sticky`/`is_announcement` para presentación y orden administrativo, además de `cache_last_post_created` para listados recientes.

## Rutas y superficies UI observadas

La entrada es `forum.php` y el controlador expone, al menos, estas acciones:

- índice de instancia y categorías raíz;
- subíndice de categoría y subcategorías;
- browse de temas recientes;
- índice de tema con paginación;
- creación de tema/respuesta y quote;
- edición/borrado de tema y post;
- búsqueda FULLTEXT;
- bookmarks del usuario;
- posts propios;
- settings de firma y notificaciones;
- rating AJAX;
- alta/baja de bookmark;
- descarga/visualización de attachments;
- administración de instancia, categorías, moderadores, rankings, settings y modificaciones.

La plantilla `topic_index.tpl` muestra autor, avatar, ranking, contadores, campos adicionales, fecha de creación/modificación, cuerpo, adjuntos, firma, rating, edición/borrado, respuesta y bookmark. La respuesta actual debe preservar estados de autenticación, autorización, locks y paginación, no solo la apariencia de la plantilla.

## Efectos secundarios e integraciones

- Leer un tema incrementa `Post.cache_views`.
- Crear un tema/respuesta incrementa caches de categoría, tema y usuario.
- Se calcula el ranking del usuario por suma ponderada de temas/posts.
- Se pueden insertar acciones `forum_new_topic` y `forum_new_reply` en el feed.
- Las preferencias de usuario pueden encolar emails al autor del tema y a quienes lo marcaron.
- Los adjuntos pasan por almacenamiento temporal y luego por un directorio asociado a usuario/post.
- Los rankings tienen imágenes cargadas y redimensionadas en `uploads_forum/rankings/`.
- La UI puede mostrar campos de perfil adicionales según configuración de instancia.

Correo, uploads, feed, censura, BBCode/HTML, avatar y perfil son dependencias externas al núcleo del foro y deben migrarse mediante adaptadores y políticas explícitas; no deben presentarse como implementados por un modelo Prisma.

## Riesgos y discrepancias que deben resolverse

1. `docs/se.sql` no contiene `CREATE TABLE se_forum_*`; el instalador es la única evidencia de esquema disponible.
2. El controlador selecciona `has_news_feed_support` en categorías, pero el instalador no la define.
3. `update_topic_has_attachments()` escribe `topic_has_attachments`, pero el esquema define `has_attachments`.
4. La PK compuesta de `se_forum_posts(id, user_id)` es inusual para un ID autoincremental; debe definirse la estrategia de ID destino y probar referencias solo por `id`.
5. Las tablas MyISAM no garantizan integridad ni transacciones.
6. ACL y moderadores son texto serializado; la conversión requiere parser, validación de usuarios y preservación de semántica.
7. `include_from_profile` y opciones PHP serializadas pueden contener referencias dinámicas o formatos inseguros.
8. Los caches pueden estar desactualizados; deben reconciliarse con posts y relaciones durante una importación controlada.
9. Email queue, posts, firmas, títulos y adjuntos pueden contener PII o contenido privado.
10. La distribución incluye `uploads_forum`; no se deben copiar uploads reales al repositorio ni a fixtures.
11. El instalador contiene operaciones destructivas o de transferencia para upgrades; queda prohibido ejecutarlo contra legacy.

## Mapeo preliminar a Prisma, sin modificar `packages/db/schema.prisma`

| Legacy | Destino preliminar | Decisión pendiente |
|---|---|---|
| `se_forum_instances` | `ForumInstance` | ID interno + `legacyId`; scope de moderadores normalizado |
| `se_forum_categories` | `ForumCategory` | self-relation, `instanceId`, ACL normalizada, caches derivados |
| `se_forum_posts` | `ForumPost` | `parentId`; raíz = topic; revisar PK legacy y sanitización |
| `se_forum_attachments` | `ForumAttachment` + storage adapter | MIME real, hash/path seguro, borrado lógico |
| `se_forum_bookmarks` | `ForumBookmark` | unique `(userId, postId)` |
| `se_forum_rankings` | `ForumRanking` | umbral y relación por instancia |
| `se_forum_ratings` | `ForumRating` | unique `(userId, postId)`, rango validado |
| `se_forum_settings` | `ForumSetting` | repositorio tipado por clave; no exponer licencia |
| `se_forum_user_instance_settings` | `ForumUserInstanceSetting` | unique `(userId, instanceId)`, caches reconstruibles |
| `se_forum_user_settings` | `ForumUserSetting` | firma y preferencias; revisar sanitización |
| `se_forum_email_queue` | `ForumEmailQueue` o adaptador de notificaciones | retención, privacidad y proveedor real |
| `moderators` serializado | `ForumModerator` | migración desde parser legacy, no campo de autorización |
| ACL separada por comas | asignaciones `ForumCategoryPermission` | preservar OR y dimensiones nivel/subred/profilecat |

Fechas destino recomendadas: `DateTime` con política UTC documentada. Contadores y últimos posts deben distinguirse entre datos fuente y caches reconstruibles. Las relaciones con `User`, `Level`, `Subnet`, `ProfileCategory`, feed, idioma y storage deben definirse contra sus inventarios respectivos, no inventarse en este incremento.

## Criterio de desbloqueo

El foro queda desbloqueado para **inventario de esquema, contrato de lectura y diseño preliminar**. La evidencia es suficiente para preparar un primer catálogo de lectura de instancias/categorías/temas, siempre que la autorización se ejecute server-side y se trate el dump como potencialmente incompleto.

El foro **no queda desbloqueado todavía para**:

- crear `schema.prisma` o una migración PostgreSQL definitiva;
- importar datos;
- declarar paridad completa;
- migrar adjuntos, email queue, settings serializados o moderadores sin transformación validada;
- afirmar que el plugin está activo en la instalación del dump;
- implementar mutaciones, feed, correo, búsqueda, ratings o uploads como integraciones reales.

## Archivos adicionales y siguiente incremento

Para este inventario inicial no falta ningún archivo esencial del plugin: el instalador, modelos, controladores y plantilla proporcionan evidencia suficiente. Para cerrar configuración efectiva y preparar una migración ejecutable aún faltan, de forma segura:

1. una exportación estructural sin `INSERT` de las tablas `se_forum_*` de la instalación efectiva, o confirmación equivalente de esquema/versiones;
2. evidencia no sensible de `se_plugins` que confirme activación y versión;
3. configuración efectiva de instancias/categorías sin nombres de usuarios, emails ni contenido;
4. decisión compartida sobre IDs legacy, zona horaria, ACL normalizada y estrategia de caches;
5. inventario de `se_users`, niveles, subredes, categorías de perfil, acciones, idioma y storage para resolver relaciones.

El siguiente paso seguro es redactar el contrato de lectura del catálogo público del foro y su matriz de paridad, no ejecutar el instalador ni modificar aún `packages/db/schema.prisma`.
