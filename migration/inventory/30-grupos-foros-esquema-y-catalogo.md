# Incremento 30 — Inventario de grupos y foros

## Alcance y estado

El código disponible permite separar dos superficies distintas:

1. **Grupos SocialEngine**: catálogo, detalle, miembros, media, comentarios y discusiones.
2. **Foro independiente**: instancias, categorías, subcategorías, temas y posts con ACL propia.

Para grupos no se necesitan archivos adicionales del plugin en esta fase. El código completo está en `docs/legacy`. Para el foro sí falta confirmar el esquema de sus tablas en el dump; su código existe, pero no se deben crear modelos Prisma desde nombres de modelos PHP sin verificar `CREATE TABLE`.

Archivos principales de grupos:

- `docs/legacy/browse_groups.php`
- `docs/legacy/group.php`
- `docs/legacy/include/class_group.php`
- `docs/legacy/include/functions_group.php`
- `docs/legacy/user_group.php`
- `docs/legacy/user_group_add.php`
- `docs/legacy/user_group_edit.php`
- `docs/legacy/user_group_edit_settings.php`
- `docs/legacy/user_group_edit_member.php`
- `docs/legacy/user_group_edit_members.php`
- `docs/legacy/user_group_subscribe.php`
- `docs/legacy/group_discussion_view.php`
- `docs/legacy/group_discussion_post.php`
- `docs/legacy/admin/admin_viewgroups.php`
- `docs/legacy/admin/admin_group.php`
- `docs/legacy/admin/admin_levels_groupsettings.php`

Archivos principales del foro:

- `docs/legacy/forum.php`
- `docs/legacy/header_forum.php`
- `docs/legacy/include/forum/lib/models.php`
- `docs/legacy/include/forum/controllers/forum_controller.php`
- controladores de categoría, tópico y post;
- `docs/legacy/include/forum/templates/`;
- administración de instancias, categorías y configuración.

## Tablas de grupos confirmadas en `docs/se.sql`

- `se_groups`
- `se_groupcats`
- `se_groupfields`
- `se_groupvalues`
- `se_groupmembers`
- `se_groupsubscribes`
- `se_groupalbums`
- `se_groupmedia`
- `se_groupcomments`
- `se_groupmediacomments`
- `se_groupmediatags`
- `se_groupstyles`
- `se_grouptopics`
- `se_groupposts`

Dependencias observadas: `se_users`, `se_levels`, `se_friends`, `se_notifys`, `se_notifytypes`, `se_actions` y el sistema común de idiomas/campos.

No se confirmó en el dump un conjunto `se_forum_*` para el plugin independiente. El foro usa modelos como `Instance`, `Category`, `Topic`, `Post` y `Ranking`, pero el código no basta para afirmar sus tablas destino.

## Esquema núcleo de grupos

### `se_groups`

- `group_id`: `int(9)`, autoincremental, primary key.
- `group_user_id`, `group_groupcat_id`: IDs enteros con default `0`.
- `group_datecreated`, `group_dateupdated`: timestamps Unix `int(14)`.
- `group_views`: contador.
- `group_title varchar(100)` y `group_desc text`.
- `group_photo varchar(10)`.
- Flags: `group_search`, `group_privacy`, `group_comments`, `group_approval`, `group_discussion`, `group_invite`, `group_upload`.
- Índice confirmado por `group_user_id`; no hay índice compuesto para catálogo por categoría/privacidad.
- Collation `utf8_unicode_ci`, engine MyISAM.

El código referencia `group_totalmembers` y `group_totaltopics` para caches y actualizaciones, pero esas columnas no aparecen en la definición confirmada de `se_groups`. Deben verificarse contra la instalación efectiva antes de diseñar campos cacheados en destino.

### Categorías y campos

`se_groupcats` contiene jerarquía mediante `groupcat_dependency`, título como ID de idioma, orden y signup.

`se_groupfields` define campos dinámicos por categoría, con tipo, dependencia, longitud, opciones `longtext`, regex, HTML, display, búsqueda y signup.

`se_groupvalues` contiene una fila por grupo y una columna confirmada `groupvalue_1 date`; el código puede escribir otras columnas dinámicas `groupvalue_<field_id>`. No debe asumirse que esta definición es completa.

### Membresías, suscripciones y discusiones

`se_groupmembers` contiene usuario, grupo, status, approved, rank y título; tiene índice por usuario/grupo.

Estados observados en el código:

- `status=1`: relación activa;
- `approved=1`: aprobada;
- `status=0` o `approved=0`: invitación/solicitud pendiente según el flujo;
- `rank`: líder, oficial o miembro; la clase usa rango 2/1/0 y `-1` para no afiliado.

`se_groupsubscribes` contiene usuario, grupo y timestamp, con unique `(user, group)`. La página de detalle actualiza el tiempo de suscripción al visualizar el grupo.

`se_grouptopics` contiene grupo, fecha, asunto, vistas, sticky, closed y creador.

`se_groupposts` contiene tópico, autor, fecha, cuerpo y deleted.

### Media, comentarios y estilos

- `se_groupalbums`: álbum por grupo, fechas, privacidad, comentarios, tags, portada, vistas.
- `se_groupmedia`: archivo, álbum, fecha, título, descripción, extensión, tamaño y usuario.
- `se_groupcomments`: comentarios del grupo.
- `se_groupmediacomments`: comentarios de media.
- `se_groupmediatags`: etiquetas con posición y texto.
- `se_groupstyles`: CSS personalizado por grupo.

Estos subflujos quedan fuera del primer catálogo.

## Catálogo público `browse_groups.php`

### Entrada y paginación

- `p`: página, default 1.
- `s`: solo `group_datecreated DESC` o `group_totalmembers DESC`.
- `v`: `0` para todos los visibles o `1` para grupos con amigos del visitante.
- `groupcat_id`: categoría opcional.
- El catálogo devuelve 10 grupos por página.

### Autorización y privacidad

El acceso exige `setting_permission_group` para visitantes o el bit correspondiente de `level_group_allow` para usuarios.

La máscara `group_privacy` se evalúa server-side para:

- propietario;
- usuario registrado;
- visitante anónimo;
- miembro activo;
- amigo del propietario;
- amigo de un miembro;
- segundo grado mediante miembros y amistades.

`v=1` limita a grupos donde el visitante tiene al menos un amigo miembro activo.

Una categoría raíz incluye raíz y subcategorías; una subcategoría solo filtra esa categoría.

### Detalle `group.php`

- Comprueba existencia y permisos del módulo.
- Calcula permisos independientes para ver, comentar, discutir, subir media e invitar.
- Incrementa vistas si el grupo es visible.
- Carga miembros, oficiales, comentarios, media, tópicos y campos dinámicos.
- Actualiza el timestamp de suscripción del visitante si existe la relación.
- Limpia notificaciones de comentarios y posts del propietario al abrir la página.
- Puede aplicar CSS personalizado según nivel.

## Discusiones de grupos

`group_discussion_post.php` permite crear temas y responder cuando la máscara `group_discussion` autoriza la operación.

Efectos de crear tema/respuesta:

- incrementa contadores de tópicos/posts;
- inserta tema y post;
- procesa BBCode/HTML;
- puede exigir código de seguridad;
- publica acción en el feed;
- notifica y puede enviar email al propietario;
- actualiza `group_lastupdate`.

El borrado desde `group.php` verifica rango y elimina tópico/post, pero la operación observada no está implementada como transacción. En destino debe ser un caso de uso transaccional con autorización por grupo y moderación.

## Foro independiente

El controlador del foro confirma:

- instancia de foro;
- categorías raíz y subcategorías;
- orden de categorías;
- categorías bloqueadas;
- lectura pública o ACL por nivel, subred, categoría de perfil y moderadores;
- caches del último post, cantidad de tópicos y posts;
- soporte opcional para feed;
- rankings por número mínimo de posts.

El foro tiene una semántica de autorización distinta a grupos y no debe fusionarse con `se_groups`/`se_grouptopics` sin confirmar tablas, migraciones del plugin y configuración de instancias.

## Contrato inicial: lectura pública de grupos

### Entrada

```text
page: entero positivo, default 1
categoryId: entero positivo opcional
view: all | friends
sort: created | members
viewer: sesión opcional
```

### Reglas

1. Validar permiso global y nivel en servidor.
2. Resolver privacidad con propietario, membresía activa, amistades y segundo grado.
3. Resolver categorías sin aceptar SQL ni columnas desde el cliente.
4. Aplicar `friends` solo con sesión autenticada.
5. Ordenar únicamente por las opciones legacy permitidas.
6. Limitar página y tamaño en el servidor.
7. No cargar miembros, tópicos, media, CSS o campos privados en la respuesta inicial.

### Salida mínima

- `legacyId` o identificador público controlado;
- título y descripción sanitizada;
- propietario público autorizado;
- categoría/subcategoría;
- fecha de creación/actualización;
- contador de miembros solo si se confirma su origen;
- vistas y miniatura mediante políticas de exposición y storage.

No existe en el esquema confirmado un estado de aprobación o expiración equivalente al negocio. No se debe agregar ese filtro.

## Mapeo preliminar a Prisma

| Legacy | Destino propuesto | Estado |
|---|---|---|
| `group_id` | `Group.legacyId` + ID interno | Requiere estrategia de IDs |
| `group_user_id` | relación `Group.owner` | Requiere `User` mapping |
| `group_groupcat_id` | categoría jerárquica con `legacyId` | Candidato a tabla catálogo |
| fechas Unix | `DateTime` UTC | Documentar `0` y zona |
| máscaras privacy/comments/discussion/upload | enteros separados | No enums; semánticas distintas |
| `groupmembers` | relación con status/approved/rank | Requerida para privacidad y futuro join |
| `grouptopics/posts` | relaciones topic/post | Fuera del primer catálogo |
| campos dinámicos | definiciones + valores JSON/normalizados | Requiere inventario efectivo |
| media/styles | metadatos/storage separado | Fuera del primer catálogo |

No se modifica todavía `packages/db/schema.prisma`.

## Riesgos y pendientes

- La privacidad de grupos comparte bits con eventos, pero sus permisos y membresías tienen semántica propia.
- El código contiene una referencia defectuosa a `$group` en una rama de privacidad de `functions_group.php`; no se debe reproducir sin prueba controlada.
- `group_totalmembers` y `group_totaltopics` se usan en código pero no están confirmados en `CREATE TABLE`.
- Los campos dinámicos y valores pueden tener columnas adicionales ausentes en el bloque base.
- El cuerpo de posts permite BBCode/HTML legacy; debe sanitizarse en destino.
- El borrado elimina varias familias y archivos sin transacción MyISAM.
- Suscripciones actualizan timestamps durante una lectura; es un efecto secundario que debe decidirse explícitamente.
- El foro independiente tiene ACL, serialización de moderadores y tablas no confirmadas en el dump.
- No copiar emails, listas de moderadores serializadas, CSS, uploads ni caches reales.

## Decisión y archivos adicionales

Existe evidencia suficiente para cerrar el inventario y diseñar el catálogo de lectura de grupos. No se implementa aún Prisma/UI porque faltan los contratos compartidos de IDs, privacidad, amistades, membresías y campos dinámicos.

Para **grupos** no necesito archivos adicionales del plugin en esta fase.

Para implementar o inventariar completamente el **foro independiente**, sí necesitaré confirmar sus definiciones SQL reales —o un dump/instalador del plugin que las contenga— porque `docs/se.sql` no muestra tablas `se_forum_*` verificables. Hasta disponer de eso, el foro queda documentado como capacidad referenciada pero no como esquema confirmado.
