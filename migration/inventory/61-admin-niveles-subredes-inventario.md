## Estado

Inventario funcional y de datos de niveles de usuario y subredes administrativas. Se añadió una fase Prisma de estructura-only para catálogos base, sin filas ni relaciones hacia `User`; no se modifican PHP/MySQL ni `docs/legacy`.

## Actores y permisos observados

Todas las páginas pasan por `admin_header.php` y requieren administrador autenticado. El código observado no define una separación de permisos por administrador para estas operaciones; la autorización efectiva queda en la consola admin y en `admin_super`/hooks donde corresponda. No se debe traducir esa observación en un permiso moderno más amplio sin revisar `class_admin.php`, hooks y configuración activa.

## Niveles (`se_levels`)

### Operaciones

- `admin_levels.php`: crear nivel, seleccionar nivel predeterminado, eliminar nivel no predeterminado, listar y ordenar.
- `admin_levels_edit.php`: validar `level_id`, editar nombre y descripción.
- `admin_levels_*settings.php`: editar columnas de capacidades/cuotas por módulo.
- El listado cuenta usuarios asociados con `se_users.user_level_id`.
- Al eliminar un nivel, el legacy mueve los usuarios al nivel predeterminado antes/después de borrar según la operación observada; esta secuencia requiere transacción en destino.

### Campos confirmados

| Legacy | Evidencia | Destino propuesto | Estado |
|---|---|---|---|
| `level_id` | filtros, validación y joins | `UserLevel.legacyId` | ID entero legacy, no PK destino |
| `level_name` | create/edit/list | `UserLevel.name` | Confirmado |
| `level_desc` | create/edit | `UserLevel.description` | Confirmado |
| `level_default` | selección y protección al borrar | `UserLevel.isDefault` | Confirmado |
| `user_level_id` | `admin_viewusers`, `admin_levels`, DDL `se_users` | `User.levelId` | Relación destino diseñada; FK y backfill pendientes |
| columnas `level_*` de módulos | `SELECT *`, páginas `admin_levels_*settings.php` | configuración normalizada o catálogo | No imponer todavía |

`se_levels` queda confirmado parcialmente por el DDL aportado para esta migración. El listado completo incluye columnas de mensajería, perfil, fotos, álbumes, música, grupos, blogs, encuestas, clasificados, eventos, negocios, vídeo, puntos, suscripciones, apps y otras capacidades de módulos. No todas esas columnas deben convertirse en campos Prisma de primer nivel: varias son flags/cuotas, otras son texto, `set` MySQL o arrays PHP serializados.

### Serialización y efectos

`level_profile_privacy` y `level_profile_comments` se leen/escriben como arrays PHP serializados. La edición recalcula opciones permitidas y modifica `user_privacy`/`user_comments` de usuarios asociados cuando dejan de ser válidas. Esta es una mutación compuesta que exige transformación explícita, validación de valores, transacción y backfill; no se reproduce con JSON inventado todavía.

## Subredes (`se_subnets`)

### Operaciones

- `admin_subnetworks.php`: configurar los campos diferenciadores primario/secundario, crear, editar y eliminar subredes.
- Lista subredes y recuenta usuarios asociados.
- Al eliminar, el legacy elimina también la variable de idioma y mueve usuarios a la subred por defecto (`0`).
- Editar limpia caché de la subred y actualiza variables de idioma.

### Campos confirmados

| Legacy | Evidencia | Destino propuesto | Estado |
|---|---|---|---|
| `subnet_id` | CRUD y joins | `Subnetwork.legacyId` | ID entero legacy |
| `subnet_name` | CRUD + `SE_Language` | `Subnetwork.nameLegacyId`/referencia i18n | DDL confirma `int(10) unsigned`, default 0 |
| `subnet_field1_qual` | create/edit/render | regla de comparación | `varchar(2)`, confirmado |
| `subnet_field1_value` | create/edit/render | valor de regla | `varchar(250)`, confirmado |
| `subnet_field2_qual` | create/edit/render | segunda regla opcional | `varchar(2)`, confirmado |
| `subnet_field2_value` | create/edit/render | segundo valor | `varchar(250)`, confirmado |
| `subnet_theme_id` | DDL y render/admin theme | `Subnetwork.themeLegacyId` | `int(1)`, default 0, confirmado |
| `user_subnet_id` | `admin_viewusers`, eliminación, DDL `se_users` | `User.subnetworkId` | Relación destino diseñada; FK y backfill pendientes |
| `setting_subnet_field1_id` | `se_settings` + DDL `se_profilefields` | configuración de campo primario | Identificador interpretable; relación/validación destino pendiente |
| `setting_subnet_field2_id` | `se_settings` + DDL `se_profilefields` | configuración de campo secundario | Identificador interpretable; relación/validación destino pendiente |

Los valores pueden representar email, categoría de perfil, opciones de campos dinámicos o timestamps Unix cuando la regla es de fecha. Las opciones de campos se obtienen de `se_profilefields` y pueden estar serializadas. No es seguro fijar `String`, `Int` o `DateTime` para todos los valores.

## Contrato destino mínimo pendiente

Antes de implementar `/admin/levels`, `/admin/subnetworks` o filtros en `/admin/users` deben verificarse:

1. esquema efectivo de `se_levels`, `se_subnets`, `se_settings`, `se_profilefields` y tablas de idioma;
2. columnas activas por plugins y configuración efectiva de módulos;
3. tipos de valores, timezone y conversión de timestamps Unix;
4. reglas de privacidad, niveles y subredes que consumen frontend/servicios;
5. estrategia para arrays PHP serializados y campos dinámicos;
6. permisos admin, auditoría y transacciones de cambios compuestos.

## Estrategia de migración

- **Expand:** crear catálogos destino separados (`UserLevel`, `Subnetwork`, configuración de reglas) con `legacyId`, sin cambiar aún `User` ni importar reglas.
- **Backfill:** importar catálogos idempotentemente, transformar serializaciones a estructuras validadas y reconciliar conteos/relaciones; registrar conflictos sin borrar legacy.
- **Compatibilidad:** leer relaciones legacy/destino mediante un adaptador durante la transición, preservando nivel, subred, privacidad y fechas.
- **Contract:** añadir relaciones obligatorias o eliminar compatibilidad solo después de conteos, reglas y paridad validados.

## Límites y siguiente paso

No se implementan CRUD, filtros de nivel/subred, asignación automática, eliminación, cambios de privacidad ni configuración por módulo en este inventario. El siguiente paso seguro es obtener o confirmar el esquema efectivo y seleccionar un primer catálogo de solo lectura; no crear modelos vacíos que aparenten paridad.

## DDL aportado para `se_levels`

El DDL recibido confirma `se_levels` como tabla MyISAM con charset/collation `utf8_unicode_ci`, `level_id int(9) NOT NULL auto_increment` como primary key y `AUTO_INCREMENT=7` en esa versión histórica. `level_name varchar(50) NOT NULL`, `level_desc text NOT NULL`, `level_default int(1) NOT NULL DEFAULT 0` y `level_signup int(1) NOT NULL DEFAULT 0` son campos base.

También quedan confirmadas, por tipo y default histórico, familias de configuración como:

- mensajería: `level_message_*`;
- perfil y privacidad: `level_profile_*`, con máscaras PHP serializadas en privacidad/comentarios;
- fotos y álbumes: extensiones, MIME, almacenamiento, tamaños y flags;
- música, grupos, blogs, encuestas, clasificados, eventos, negocios y vídeo;
- cuotas numéricas, flags de capacidad, campos `text`, valores `varchar` usados para números y un `set('side','tab')` en álbumes;
- configuraciones de puntos, suscripciones, temas y apps.

La presencia de columnas de módulos no demuestra que cada plugin esté activo. Para el destino se recomienda separar el catálogo estable (`legacyId`, nombre, descripción, default, signup) de un payload de capacidades versionado/validado, con transformadores específicos para serializaciones PHP; no copiar el DDL como un modelo monolítico sin estrategia de compatibilidad.

La relación `se_users.user_level_id` no fue incluida en el DDL aportado de `se_levels`; sigue pendiente la definición de `se_users` y la reconciliación de usuarios antes de añadir una FK Prisma.

## DDL aportado para `se_subnets`

El DDL recibido confirma `se_subnets` como tabla MyISAM con charset/collation `utf8_unicode_ci`, `subnet_id int(9) NOT NULL auto_increment` como primary key y `AUTO_INCREMENT=4` en esa versión histórica.

Campos confirmados:

- `subnet_name int(10) unsigned NOT NULL DEFAULT 0`: referencia a una variable de idioma, no texto visible directo;
- `subnet_field1_qual varchar(2) NOT NULL DEFAULT ''` y `subnet_field1_value varchar(250) NOT NULL DEFAULT ''`;
- `subnet_field2_qual varchar(2) NOT NULL DEFAULT ''` y `subnet_field2_value varchar(250) NOT NULL DEFAULT ''`;
- `subnet_theme_id int(1) NOT NULL DEFAULT 0`.

Esto permite diseñar el catálogo base de subredes y preservar los valores de regla como texto, pero no permite todavía evaluar las reglas: faltan `se_settings` para saber qué campos son primario/secundario, `se_profilefields`/categorías para interpretar opciones y `se_users` para resolver asignaciones.

## Configuración global (`se_settings`)

### DDL confirmado

El DDL aportado confirma `se_settings` como una tabla histórica MyISAM con `DEFAULT CHARSET=utf8`, `COLLATE=utf8_unicode_ci`, `setting_id int(9) NOT NULL auto_increment` como primary key y `AUTO_INCREMENT=2` en esa versión. La tabla contiene una fila/configuración global por instalación; el DDL no define claves foráneas.

La evidencia de tipos y defaults debe conservarse como contrato histórico, no copiarse automáticamente a Prisma. Incluye `tinyint`, `smallint`, `int`, `varchar` y `text`, varios campos `unsigned`, defaults operativos y cinco campos `NOT NULL` sin default explícito: `setting_mass_message_from_user`, `setting_mass_message_per_minute`, `setting_mass_email_per_minute`, `setting_mass_message_last_execute` y `setting_mass_email_last_execute`, según el comportamiento de inserción de la versión legacy.

### Clasificación funcional

| Familia | Campos representativos | Tratamiento destino |
|---|---|---|
| Identidad y operación global | `setting_key`, `setting_version`, `setting_online`, `setting_url`, `setting_username` | Configuración operativa versionada; validar si existe más de una fila antes de imponer singleton |
| Idioma, zona horaria y formato | `setting_lang_*`, `setting_timezone`, `setting_dateformat`, `setting_timeformat` | Contrato explícito de locale/timezone; no asumir que `-8` equivale a una zona IANA |
| Permisos globales | `setting_permission_*`, `setting_invite_code`, `setting_comment_code`, `setting_login_code`, `setting_contact_code` | Flags de capacidad/entrada; deben convivir con autorización server-side y permisos por nivel |
| Registro y acciones | `setting_signup_*`, `setting_actions_*`, `setting_banned_*` | Reglas de registro, privacidad, visibilidad y límites; listas bloqueadas requieren protección y validación |
| Conexiones | `setting_connection_*`, `setting_connection_types` | Reglas de relaciones; `setting_connection_types` requiere transformar la representación histórica |
| Subredes | `setting_subnet_field1_id`, `setting_subnet_field2_id` | Identificadores de campos que gobiernan las dos reglas de `se_subnets`; no evaluar sin `se_profilefields` y `se_users` |
| Correo, caché y sesión | `setting_email_fromname`, `setting_email_fromemail`, `setting_cache_*`, `setting_session_options` | Separar configuración pública/operativa de secretos; opciones textuales requieren parser y allowlist |
| Chat, IM y contenido | `setting_chat_*`, `setting_im_*`, `setting_*_html`, `setting_permission_album/group/blog/poll/classified/event` | Capacidades y límites por módulo; HTML debe conservar su política de sanitización, no tratarse como texto confiable |
| Mapas y geolocalización | `setting_permission_gmap`, `setting_gmap_f_*`, `setting_gmap_profile_embed`, `setting_gmap_icon`, `setting_gmap_mapfields`, opciones Radcodes | Adaptador de proveedor y campos geográficos; validar licencias/llaves fuera del repositorio |
| Tienda, pagos y unidades | `setting_permission_gstore`, `gstore_*`, `setting_epayment_*`, `setting_geo_distance_unit` | Configuración de módulo/proveedor; moneda y símbolo no sustituyen un contrato de pagos |
| Negocios | `setting_business_*`, `setting_permission_business` | Requisitos de formularios y catálogos de ubicación; listas de países/provincias/ciudades pueden estar serializadas |
| Vídeo | `setting_permission_video`, `setting_video_*` | Restricciones de procesamiento y archivos; validar rutas, MIME, extensiones y límites en servidor |
| Temas y contacto | `setting_permission_theme`, `setting_theme_*`, `setting_permission_contactimporter` | Configuración de presentación/integración, con licencias fuera del código versionado |
| Mensajería masiva | `setting_mass_*` | Límites y marcas de ejecución; exige auditoría, concurrencia controlada y transacciones en destino |

### Serialización y valores textuales

Los campos `text` no deben mapearse ciegamente a JSON ni a enums. Como mínimo requieren transformadores y validación por familia:

- `setting_banned_ips`, `setting_banned_emails`, `setting_banned_usernames` y `setting_banned_words`: listas históricas con impacto directo en seguridad y registro;
- `setting_connection_types`, `setting_cache_file_options`, `setting_cache_memcache_options` y `setting_session_options`: opciones estructuradas o serializadas cuyo formato debe identificarse desde el código legacy;
- `setting_gmap_mapfields`, `setting_business_countries`, `setting_business_provinces`, `setting_business_cities`, `setting_video_mimes` y `setting_video_exts`: listas/mapas dependientes de módulos;
- `setting_im_html`, `setting_poll_html`, y `setting_group_discussion_html`: contenido/política HTML que debe sanitizarse y validarse;
- `setting_video_ffmpeg_path` y otros `varchar` de proveedor/ruta: valores operativos que no deben ejecutarse sin allowlist.

### Secretos, licencias y datos no versionables

Nunca copiar a código, fixtures, reportes, logs ni migraciones los valores de:

- `setting_gmap_api`, `setting_gmap_license` y `setting_radcodes_google_map_api`;
- `setting_business_license`, `setting_theme_license` y `setting_contactimporter_license`;
- `setting_email_fromemail` si contiene una dirección operativa real, ni opciones de caché/sesión si contienen credenciales o endpoints privados;
- cualquier valor real de listas bloqueadas, correo, proveedores de pago o integraciones.

En una futura importación autorizada, estos campos deben entrar por un canal de secretos/configuración de despliegue, con redacción en logs y comprobaciones de presencia/forma, nunca mediante valores legacy versionados. El DDL confirma su existencia y longitud, pero no autoriza leer ni migrar sus valores.

### Bloqueos derivados

`se_settings` permite diseñar el contrato de configuración global y confirma que `setting_subnet_field1_id`/`setting_subnet_field2_id` son referencias operativas a campos de perfil, pero aún faltan `se_profilefields`, `se_languagevars` y `se_users`. Por tanto, sigue bloqueado evaluar reglas de subred, resolver nombres localizados, importar filas o añadir relaciones `User.levelId`/`User.subnetworkId`. Tampoco se implementan todavía CRUD de settings ni cambios de configuración: requieren permisos granulares, auditoría, secretos separados, validación por módulo y transacciones.

## Usuarios, campos dinámicos e idioma: DDL aportado

### `se_users`

El DDL recibido confirma `se_users` como tabla MyISAM con `DEFAULT CHARSET=utf8`, `COLLATE=utf8_unicode_ci`, `user_id int(9) NOT NULL auto_increment` como primary key y `AUTO_INCREMENT=34` en esa versión histórica. No declara foreign keys.

| Familia | Campos | Implicación de migración |
|---|---|---|
| Relaciones administrativas | `user_level_id`, `user_subnet_id`, `user_profilecat_id`, `user_language_id` | Permite diseñar las relaciones con nivel, subred, categoría de perfil e idioma; primero reconciliar IDs y filas |
| Identidad y acceso | `user_email varchar(70) UNIQUE`, `user_newemail`, `user_username varchar(64) UNIQUE`, `user_displayname`, `user_password`, `user_code` | Email/username tienen unicidad legacy; contraseña y código son secretos de autenticación y nunca se copian a fixtures o reportes |
| Estado de cuenta | `user_enabled`, `user_verified`, `user_signupdate`, `user_lastlogindate`, `user_lastactive`, `user_dateupdated` | Los tiempos son Unix `int(14)`; requieren conversión explícita, timezone documentada y preservación de cero como valor histórico si aplica |
| Red y actividad | `user_ip_signup`, `user_ip_lastactive`, `user_logins`, `user_invitesleft`, `user_status`, `user_status_date` | IPs, actividad y estado son datos sensibles; no versionar valores reales ni asumir IPv6 por el límite legacy `varchar(15)` |
| Privacidad y preferencias | `user_blocklist`, `user_invisible`, `user_saveviews`, `user_search`, `user_privacy`, `user_comments`, `user_profile_album`, `user_theme_id` | Requiere conservar máscaras, listas y enum `tab/side`; aplicar reglas de nivel y privacidad antes de exponer datos |
| Perfil visible y módulos | `user_fname`, `user_lname`, `user_photo`, `user_sales`, `user_userpoints_allowed`, `mood` | PII y uploads no se incluyen en inventarios de datos; la foto es identificador legacy, no el archivo |

El DDL confirma índices únicos separados para `user_username` y `user_email`, pero no confirma normalización/case-folding de la aplicación; el destino debe definirla mediante una prueba controlada antes de imponer índices funcionales. Los valores `user_level_id=0` y `user_subnet_id=0` requieren representar explícitamente el fallback/default legacy, no una FK obligatoria ciega.

### `se_profilefields`

El DDL recibido confirma `se_profilefields` como tabla MyISAM con charset/collation `utf8_unicode_ci`, `profilefield_id int(9) NOT NULL auto_increment` como primary key, `AUTO_INCREMENT=99` y un índice no único sobre `profilefield_profilecat_id`.

- `profilefield_profilecat_id` enlaza funcionalmente con la categoría de perfil usada por `se_users.user_profilecat_id`.
- `profilefield_dependency`, `profilefield_title`, `profilefield_desc` y `profilefield_error` son identificadores de dependencias o variables de idioma; no son textos visibles directos.
- `profilefield_type`, `profilefield_signup`, `profilefield_display`, `profilefield_required`, `profilefield_special`, `profilefield_search` son flags/tipo legacy y no deben convertirse en permisos modernos sin mapear su semántica.
- `profilefield_style`, `profilefield_link`, `profilefield_regex`, `profilefield_html` y `profilefield_maxlength` son restricciones/presentación; `profilefield_link` y HTML requieren validación server-side.
- `profilefield_options longtext` puede contener opciones serializadas; exige parser versionado, validación por `profilefield_type` y preservación de valores no reconocidos.

Estos campos permiten interpretar los identificadores de configuración de subred y validar valores de regla, pero no demuestran por sí solos qué tipos/operadores usa cada subred. Eso requiere cotejar el código legacy y datos autorizados.

### `se_languagevars`

El DDL recibido confirma `se_languagevars` como tabla MyISAM con charset/collation `utf8_unicode_ci`, sin primary key declarada, y con clave única compuesta `(`languagevar_id`, `languagevar_language_id`)`. `languagevar_id` es `int(9) unsigned NOT NULL DEFAULT 0`; `languagevar_language_id` es `int(9) NOT NULL DEFAULT 0`; `languagevar_value` y `languagevar_default` son `text` anulables.

`se_subnets.subnet_name` es por tanto un identificador de variable de idioma, no un nombre textual directo. La resolución visible exige idioma solicitado, fallback `languagevar_default` y comportamiento legacy ante variables ausentes. El destino debe usar una clave estable y relación explícita, sin asumir que la ausencia de primary key histórica equivale a ausencia de unicidad.

### Datos sensibles y serializados

No se deben copiar a código, fixtures, logs o reportes valores reales de `user_password`, `user_code`, emails, `user_newemail`, IPs, blocklists, estados privados, nombres, apellidos, fotos ni variables de idioma que contengan contenido privado. Las contraseñas legacy no se migran ejecutando algoritmos históricos dentro de la aplicación moderna; cualquier transición de credenciales necesita un procedimiento separado, auditado y autorizado.

`user_blocklist`, `profilefield_options` y las máscaras de privacidad/comentarios de niveles requieren transformadores específicos. No se deben mapear automáticamente a JSON, enums o listas sin preservar el significado legacy y los valores desconocidos.

### Alcance desbloqueado y pendiente

Con estos DDL ya está respaldado el diseño de las relaciones conceptuales `User.levelId`, `User.subnetworkId`, `User.profileCategoryId`, `User.languageId`, `UserLevel`, `Subnetwork`, `Setting`, campos dinámicos y variables de idioma. Siguen pendientes la fuente de filas autorizada, el mapeo completo de IDs/idiomas, la conversión de timestamps, la semántica de operadores y serializaciones, los contratos de permisos/auditoría y las pruebas de paridad. Por ello no se añaden todavía FKs Prisma, imports, CRUD mutante ni cambios en `User`.

## Fase Prisma implementada: estructura-only

Se añadió `packages/db/prisma/migrations/20260802180000_admin_catalog_structure/migration.sql` y los modelos correspondientes en `packages/db/schema.prisma`:

| Destino | Tabla | Alcance incluido | Alcance excluido |
|---|---|---|---|
| `UserLevel` | `user_levels` | `legacyId`, nombre, descripción, `isDefault`, `isSignup`, payload opcional de capacidades | columnas `level_*` completas, serializaciones, filas legacy y relación con `User` |
| `Subnetwork` | `subnetworks` | `legacyId`, referencia `nameLegacyId`, reglas textuales 1/2 y `themeLegacyId` | evaluación de operadores, nombres localizados, filas y relación con `User` |
| `LanguageVariable` | `language_variables` | ID legacy, idioma, valor y fallback, unicidad `(legacyId, languageId)` | importación de textos reales y catálogo completo de idiomas |
| `Setting` | `settings` | ID/key/version, flags operativos no sensibles y `subnetField1Id`/`subnetField2Id` | secretos, licencias, listas bloqueadas, serializados y configuración completa de módulos |

La migración es aditiva y no contiene `INSERT`, claves foráneas a `User`, cambios destructivos ni datos reales. `legacyId` conserva la correspondencia futura sin imponer todavía que los IDs legacy sean primary keys destino. Los modelos no se relacionan aún entre sí porque el DDL MyISAM no declara foreign keys y faltan filas autorizadas para reconciliar valores `0`, idiomas, categorías y referencias.

La migración fue aplicada localmente con `pnpm exec prisma migrate deploy` contra PostgreSQL `clonse` en `localhost:5432`. `prisma migrate status` quedó sin migraciones pendientes. El verificador `migration/scripts/admin-catalog-verify.mjs` confirmó que las cuatro tablas son accesibles mediante Prisma y tienen conteo inicial `0`: `user_levels`, `subnetworks`, `language_variables` y `settings`. Este conteo vacío es intencional: no se ejecutaron imports ni backfills.

Esta fase no constituye paridad ni habilita `/admin/levels`, `/admin/subnetworks`, filtros por nivel/subred, CRUD de settings o backfills. Antes de esas capacidades se requieren transformadores, contratos de autorización/auditoría, pruebas de unicidad y un plan de importación idempotente sin PII ni secretos.

## Lectura admin implementada

Se implementaron las rutas Server Component protegidas:

- `/admin/levels`: lista `legacyId`, nombre, descripción y flags base de `UserLevel`;
- `/admin/subnetworks`: lista IDs, reglas textuales y tema de `Subnetwork`, sin resolver nombres i18n;
- `/admin/settings`: lista únicamente el núcleo no sensible de `Setting` y los identificadores de campos de subred.

Las consultas viven en `src/server/admin/catalogs.ts`, usan DTOs administrativos y `select` explícito. Cada página ejecuta `getAdminAccessState()` antes de consultar Prisma y redirige a `/admin/login` si no existe sesión administrativa válida.

Las rutas muestran estado vacío cuando no hay filas, como ocurre actualmente tras la migración structure-only. `/admin/levels`, `/admin/subnetworks` y `/admin/settings` mantienen lecturas del núcleo no sensible; `/admin/language-variables` lista únicamente IDs, idioma y valores de variable/fallback para el catálogo administrativo, sin resolver nombres de subred ni aplicar fallback en reglas. No hay formularios, Server Actions mutantes, edición, eliminación, filtros por nivel/subred ni exposición de `capabilities`, serializados, secretos, licencias o filas legacy. El estado vacío y la métrica del dashboard no se interpretan como paridad de datos.
