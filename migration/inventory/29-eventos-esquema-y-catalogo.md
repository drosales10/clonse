# Incremento 29 — Inventario de eventos y catálogo público

## Estado de la evidencia

El módulo de eventos está presente en `docs/legacy`; no se requieren archivos adicionales del plugin para este inventario inicial. Se revisaron los entrypoints públicos, detalle, AJAX, clase de dominio, funciones, superficies de usuario y administración.

Archivos principales:

- `docs/legacy/browse_events.php`
- `docs/legacy/event.php`
- `docs/legacy/show_event_public.php`
- `docs/legacy/include/class_event.php`
- `docs/legacy/include/functions_event.php`
- `docs/legacy/event_ajax.php`
- `docs/legacy/user_event.php`
- `docs/legacy/user_event_add.php`
- `docs/legacy/user_event_edit.php`
- `docs/legacy/user_event_edit_settings.php`
- `docs/legacy/user_event_edit_members.php`
- `docs/legacy/user_event_upload.php`
- `docs/legacy/admin/admin_viewevents.php`
- `docs/legacy/admin/admin_event.php`
- `docs/legacy/admin/admin_levels_eventsettings.php`
- plantillas públicas, de usuario y de administración de eventos

Se detectaron además flujos heredados o incompletos en `show_event_public.php`, `ajax_get_upcomingevent.php` y la rama `getfiles` de `event_ajax.php`; no se toman como contrato nuevo sin pruebas controladas.

## Tablas confirmadas en `docs/se.sql`

- `se_events`
- `se_eventcats`
- `se_eventfields`
- `se_eventvalues`
- `se_eventmembers`
- `se_eventalbums`
- `se_eventmedia`
- `se_eventcomments`
- `se_eventmediacomments`
- `se_eventmediatags`
- `se_eventstyles`

Dependencias observadas: `se_users`, `se_levels`, `se_friends`, `se_usersettings`, `se_notifys`, `se_notifytypes`, `se_actions`, `se_actiontypes` y el sistema común de campos/idiomas. El dump usa MyISAM y no aplica foreign keys.

## Esquema núcleo

### `se_events`

- `event_id`: `int(10) unsigned`, autoincremental, primary key.
- `event_user_id`, `event_eventcat_id`: IDs enteros unsigned obligatorios con default `0`.
- `event_datecreated`, `event_dateupdated`: timestamps Unix `int(10) unsigned`.
- `event_views`: contador unsigned.
- `event_title varchar(128)` y `event_desc text`, ambos nullable según el dump.
- `event_date_start`, `event_date_end`: `bigint(20) unsigned`, default `0`; son timestamps Unix. El final `0` representa evento sin fecha final.
- `event_host varchar(255)` y `event_location text`.
- `event_photo varchar(16)`.
- Flags unsigned: `event_search`, `event_privacy`, `event_comments`, `event_inviteonly`, `event_upload`, `event_tag`, `event_invite`.
- `event_title_cleaned varchar(128)`.
- Índices: primary key y un índice por `event_user_id`; no hay índice compuesto específico para fecha/categoría/privacidad.
- Collation `utf8_unicode_ci`, engine MyISAM.

### Categorías y campos dinámicos

`se_eventcats` contiene `eventcat_id`, `eventcat_dependency`, `eventcat_title` como ID de idioma, orden y signup.

`se_eventfields` define campos por categoría, dependencia, tipo, opciones `longtext`, regex, HTML, longitud y flags de búsqueda/display/signup.

`se_eventvalues` solo contiene una fila base por evento y `eventvalue_event_id` indexado. El código genera columnas dinámicas `eventvalue_<field_id>` y serializa opciones de campos; no se debe fijar un modelo Prisma definitivo sin inventariar columnas y definiciones efectivas.

### Membresía y RSVP

`se_eventmembers` contiene usuario, evento, `status`, `approved`, `rank`, título y `rsvp`, con índices por usuario/evento y por estado/aprobación/RSVP.

Estados observados:

- miembro confirmado: `status=1`, `approved=1`;
- solicitud pendiente: `status=1`, `approved=0`;
- invitación pendiente: `status=0`, `approved=1`;
- eliminado/no miembro: ausencia de fila;
- RSVP: valores `-1` a `4` son aceptados por la clase, aunque la UI usa estados visibles específicos.

El evento mantiene `event_totalmembers` en el código, pero esa columna no aparece en la definición confirmada de `se_events`; cualquier referencia debe verificarse contra la instalación efectiva antes de mapear contadores.

### Media y estilos

- `se_eventalbums`: álbum por evento, fechas, búsqueda, privacidad, comentarios, tags, portada, vistas.
- `se_eventmedia`: archivo por álbum, usuario, fecha, título, descripción, extensión y tamaño.
- `se_eventcomments`: comentarios del evento.
- `se_eventmediacomments`: comentarios de archivos.
- `se_eventmediatags`: posiciones y texto de etiquetas sobre media.
- `se_eventstyles`: CSS personalizado por evento.

Estos subdominios no se incluyen en el primer catálogo de lectura.

## Comportamiento del catálogo `browse_events.php`

### Entrada

- `p`: página, default 1.
- `s`: orden permitido por creación, miembros, inicio o fin ascendente/descendente.
- `v`: modo de vista; valores válidos `1`, `2` y `3`.
- `eventcat_id`: categoría opcional.

### Filtros observados

- La configuración global `setting_permission_event` controla acceso anónimo; el nivel del usuario debe incluir `level_event_allow`.
- Privacidad evaluada server-side mediante máscara:
  - `1`: propietario;
  - `2`: miembro/invitado con relación activa;
  - `4`: amigo del creador;
  - `8`: amigo de un miembro;
  - `16`: segundo grado mediante miembros y amistades;
  - `32`: usuario registrado;
  - `64`: visitante anónimo.
- `v=2` limita a eventos de amigos del usuario.
- `v=3` limita a eventos cuyo inicio es posterior a `time()` y fuerza orden por inicio ascendente.
- La categoría raíz incluye ella misma y sus subcategorías; una subcategoría filtra solo esa subcategoría.
- El catálogo devuelve 10 eventos por página.
- Se carga el creador y el conjunto de campos/categorías dinámicas.

No se observa un filtro de expiración ni un estado de aprobación equivalente al de negocios. No debe añadirse en destino sin evidencia adicional.

## Detalle `event.php`

- Carga el evento por ID y verifica existencia.
- Calcula privacidad mediante `event_privacy_max()` según propietario, invitado, amistades y registro/anónimo.
- Calcula permisos independientes para ver, comentar, subir media e invitar.
- Incrementa vistas solo al permitir la lectura.
- Carga miembros confirmados, solicitudes, invitaciones y RSVP con paginación de 10.
- Carga oficiales con `rank > 1`.
- El propietario puede provocar limpieza contextual de notificaciones de comentarios.
- Puede aplicar CSS personalizado según nivel.
- Descodifica el cuerpo HTML antes de renderizarlo.

## Efectos secundarios fuera del catálogo

- Crear evento crea automáticamente membresía del propietario, estilo, valores y álbum; registra una acción.
- Unirse puede crear solicitud, invitación, notificación, email, acción y modificar el contador de miembros.
- Aprobar/rechazar/cancelar/eliminar miembros modifica membresías, contadores, notificaciones y acciones.
- RSVP actualiza la membresía y puede publicar una acción.
- Borrar un evento elimina miembros, álbumes, media, comentarios, estilo, valores y archivos.
- Los uploads dependen de límites de `se_levels` y de storage `uploads_event`.

Estos efectos deben migrarse como casos de uso transaccionales independientes, no como parte de la consulta del catálogo.

## Contrato inicial de lectura

### Entrada

```text
page: entero positivo, default 1
categoryId: entero positivo opcional
sort: created | members | startsAt | endsAt, con dirección controlada
view: all | friends | upcoming
viewer: sesión opcional
```

### Reglas

1. Validar configuración y permiso de módulo en servidor.
2. Aplicar máscara de privacidad con contexto de sesión, propietario, membresías y amistades.
3. Resolver categoría raíz/subcategoría sin aceptar SQL o nombres de columna desde cliente.
4. Para `upcoming`, exigir `startsAt > now` y ordenar por inicio ascendente.
5. Paginación estable y límite de página impuesto en servidor.
6. No incluir miembros, emails, RSVP, media o CSS en la respuesta inicial salvo que una política posterior lo autorice.

### Salida mínima

- identificador público y `legacyId`;
- título y descripción sanitizada;
- propietario público autorizado;
- categoría y subcategoría;
- inicio, fin, lugar y anfitrión según política;
- contador público validado, sin confiar automáticamente en columnas inconsistentes;
- miniatura mediante adaptador de storage, si existe autorización.

Un evento inexistente o no visible debe responder como no encontrado/no visible sin revelar si falló por privacidad, existencia o estado.

## Mapeo preliminar a PostgreSQL/Prisma

| Legacy | Destino propuesto | Estado |
|---|---|---|
| `event_id` | `Event.legacyId` + ID interno | Requiere estrategia de IDs |
| `event_user_id` | relación `Event.owner` | Requiere correspondencia con `User.id` |
| `event_eventcat_id` | categoría con `legacyId` y jerarquía | Candidato a tabla catálogo |
| `event_date_start/end` | `DateTime` UTC nullable | `0` en final significa ausencia |
| `event_privacy/comments/upload/tag` | enteros bitmask separados | No enums; cada máscara tiene semántica distinta |
| `event_inviteonly` | booleano tras validar valores | Confirmar valores fuera de 0/1 |
| `eventmembers` | relación de membresía con estado/RSVP | Fuera del primer catálogo, pero requerida para privacidad |
| `eventvalues` | definiciones + valores tipados/JSON | Requiere inventario dinámico |
| media/albums | metadatos separados de storage | Fuera del primer catálogo |

No se modifica todavía `packages/db/schema.prisma`. El modelo requiere resolver usuarios, amistades, membresías y campos dinámicos compartidos.

## Riesgos y dependencias

- La privacidad de eventos no es igual a la de negocios: incluye invitación y miembros como niveles propios.
- El código usa amistades direccionales y estados; el destino debe probar la orientación de la relación.
- Hay inconsistencias heredadas: referencias a `event_totalmembers` no confirmadas por la definición leída y variables no inicializadas en algunos endpoints.
- `eventfield_options` usa serialización PHP; no usar `unserialize` inseguro ni copiar payloads sin transformación.
- El cuerpo y estilos contienen HTML/CSS legacy; sanitizar y separar presentación.
- El catálogo no tiene aprobación/expiración confirmada.
- Los endpoints AJAX de RSVP, invitaciones y media no deben reutilizarse sin autorización server-side explícita.
- Emails, notificaciones y payloads de usuarios no deben entrar en fixtures ni logs.

## Decisión

Existe evidencia suficiente para cerrar el inventario y diseñar una lectura pública de eventos. No se implementa todavía el modelo Prisma ni la UI porque el catálogo depende del contrato compartido de privacidad, IDs de usuarios, amistades, membresías y campos dinámicos.

No se necesitan archivos adicionales del plugin para esta fase. Se solicitarán únicamente si aparece una extensión externa, XML de instalación o comportamiento que no esté presente en `docs/legacy`.
