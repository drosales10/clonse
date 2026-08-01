# Incremento 26 — Inventario del esquema y contrato inicial del catálogo público de negocios

## Estado de la evidencia

El dump `docs/se.sql` es un dump phpMyAdmin generado el 15-02-2010 para MySQL 5.0.89. Se inspeccionaron únicamente bloques `CREATE TABLE` y sus claves/índices; no se importaron datos ni se versionan filas del dump.

Las tablas siguientes están confirmadas por definición en el dump:

- `se_businesses`
- `se_businesscats`
- `se_businesstypes`
- `se_businessvalues`
- `se_businessprofilevalues`
- `se_businessfields`
- `se_businessprofilecats`
- `se_businessprofilefields`
- `se_businessalbums`
- `se_businessmedia`
- `se_businessmediacomments`
- `se_businesscomments`
- `se_businessratings`
- `se_businesstags`
- `se_epaymenttransactions`
- `se_geolocations`
- `se_levels`
- `se_settings`

El código de `docs/bussiness/include/class_business.php` también referencia `se_businessclaims` y `se_businessmodules`, pero no existe un `CREATE TABLE` correspondiente en `docs/se.sql`. Quedan como dependencias no confirmadas y fuera de este incremento. Lo mismo aplica a plugins o módulos externos que se cargan mediante `SECore::getPlugins()`.

## Esquema confirmado relevante

### `se_businesses`

- Identidad: `business_id` `int(10) unsigned`, autoincremental, primary key.
- Ownership y clasificación: `business_user_id`, `business_businesstype_id`, `business_businesscat_id`, todos `int(10) unsigned NOT NULL` con default `0`.
- Fechas Unix: `business_datecreated`, `business_dateupdated`, `business_dateapproved`, `business_dateexpired`, `int(10) unsigned NOT NULL` con default `0`.
- Contadores/cache: `business_views`, `business_cache_rating_total`, `business_totalcomments`, además de `business_cache_rating` y `business_cache_rating_weighted` como `float`.
- Texto: `business_title varchar(128)`, `business_summary text`, `business_desc text`, `business_slug varchar(128)`, teléfono/URL y campos de ubicación hasta `varchar(255)`; varios son nullable.
- Estado y privacidad: `business_search`, `business_privacy`, `business_comments`, `business_featured`, `business_sponsored`, `business_approved`, `business_epayment` como `tinyint(3) unsigned NOT NULL` con default `0`.
- Presentación: `business_tags varchar(128)`, `business_photo varchar(16)`, `business_styles text`.
- Índices: primary key por `business_id`, índice por `business_cache_rating` e índice por `business_user_id`. No hay índice compuesto que cubra directamente el filtro público observado.
- Collation: `utf8_unicode_ci`, engine MyISAM.

### Catálogos y valores

- `se_businesscats`: `businesscat_id` PK; `businesscat_dependency` para jerarquía; título como ID de idioma (`businesscat_title`), orden, signup y vínculo a `businessprofilecat_id`.
- `se_businesstypes`: `businesstype_id` PK; título como ID de idioma; descripción, coste decimal, duración en días y flags de aprobación, pago, destacado, patrocinado, habilitado y perfil. `businesstype_tabs` es `text` y el PHP lo serializa como array.
- `se_businessvalues`: solo PK y `businessvalue_business_id` indexado. El código dinámico puede añadir columnas mediante configuración de campos; no se puede convertir a un modelo fijo sin inventariar la instalación efectiva.
- `se_businessprofilevalues`: solo PK y `businessprofilevalue_business_id` indexado, con la misma advertencia sobre campos dinámicos.
- `se_businessfields` y `se_businessprofilefields`: catálogos de campos dinámicos. `*_options` es `longtext`, `*_style`/regex/link son texto y existen flags de búsqueda, alta, display y requerido.
- `se_businesstags`: `tag_id` PK, `tag_object_id`, `tag_name`; unique compuesto `(tag_object_id, tag_name)` e índices por objeto y nombre. El código también mantiene `business_tags` como CSV en `se_businesses`; ambos orígenes no deben duplicarse en destino sin una decisión de autoridad.

### Dependencias de lectura opcionales

- `se_businessratings`: unique `(businessrating_business_id, businessrating_user_id)`, rating de 1 a 5 según el controlador y fecha Unix. Es necesario para detalle/rating, no para el primer catálogo.
- `se_businessalbums`, `se_businessmedia`, `se_businessmediacomments`: álbum, metadatos de archivos y comentarios de media. Hay índices de FK lógica, pero MyISAM no impone foreign keys.
- `se_businesscomments`: comentarios directos del negocio, con índices por negocio y autor.
- `se_geolocations`: postal/país/ciudad/provincia únicos juntos y latitud/longitud decimales. El legacy usa esta tabla para proximidad por código postal.
- `se_epaymenttransactions`: transacciones por `item_id` y `item_type`; el dominio de negocio selecciona la última transacción con `item_type='business'`. Contiene campos sensibles de pago y no entra en el catálogo público.
- `se_levels`: contiene flags `level_business_*`, incluidos allow, map, style, album, search y límites de upload, además de máscaras PHP serializadas de privacidad/comentarios.
- `se_settings`: contiene `setting_permission_business`, requisitos de campos, países/provincias/ciudades, unidad de distancia y configuración de mapa. Sus valores efectivos deben verificarse en la instalación activa, no asumir los defaults del dump.

## Comparación con `docs/bussiness`

### Catálogo confirmado

`browse_businesses.php` construye el catálogo con estas invariantes:

1. `business_search = 1`.
2. `business_approved = 1`.
3. `business_dateexpired = 0` o `business_dateexpired > now`.
4. La visibilidad depende del contexto del visitante y de `business_privacy`: propietario, registrado, anónimo, amigo, subred o segundo grado según la máscara legacy.
5. Categoría exacta o descendiente mediante `businesscat_dependency`.
6. Búsqueda por título, resumen, teléfono, URL y tags; ubicación por calle, ciudad, provincia, país, postal y barrio; además de barrio, ciudad, provincia, país, postal, tag, destacado y prefijo de título.
7. Paginación de 10 elementos y orden permitido por título, aprobación, actualización, rating ponderado, vistas o comentarios; el patrocinado precede al orden elegido.
8. El detalle (`business.php`) repite aprobación, expiración y autorización de privacidad antes de incrementar vistas. El incremento de vistas es un efecto secundario posterior a autorizar la lectura.

`businesses.php` añade bloques de destacados, patrocinados, recientes, categorías/localizaciones populares, tags y módulos activos. Esos bloques no son necesarios para el primer contrato de búsqueda y dependen de módulos/plugins.

### Dependencias y diferencias que no se deben ocultar

- El propietario se determina por `business_user_id`; el destino actual usa IDs `String`, por lo que hace falta una tabla de correspondencia `legacy user id -> User.id` antes de declarar una relación Prisma.
- Subredes no están modeladas todavía en el destino; la rama de privacidad `SUBNET` no puede implementarse como un simple booleano.
- La privacidad es una máscara de bits, no un enum estable. Debe conservarse como entero y evaluarse en un servicio server-side con el mismo significado de bits, incluyendo amigo y segundo grado.
- Títulos de categorías y tipos son IDs de idioma, no texto visible. No deben mapearse a `String` sin inventariar `se_language*` y resolver la traducción efectiva.
- `business_desc` se decodifica como HTML en el legacy. El destino debe sanitizar al renderizar o almacenar una representación segura; nunca inyectar HTML legacy directamente.
- `business_tags` es CSV y `se_businesstags` es una tabla paralela. Hace falta una decisión de precedencia y una reconciliación antes de imponer una relación normalizada.
- Fechas `int` representan Unix seconds; `business_dateexpired=0` significa sin expiración, no `1970-01-01`.
- MyISAM no impone integridad referencial ni cascadas. Las relaciones y eliminaciones del destino deben ser explícitas y transaccionales.

## Contrato inicial: lectura pública de negocios

### Entrada

- `page`: entero positivo, default 1.
- `pageSize`: entero acotado por servidor; el comportamiento observado usa 10.
- `sort`: unión cerrada de `title`, `dateapproved`, `dateupdated`, `rating`, `view`, `comment`.
- `keyword`, `location`, `neighborhood`, `tag`, `city`, `province`, `country`, `postal`, `letter` y `categoryId`: strings normalizados y con límites de longitud.
- `featured`: booleano.
- Contexto de sesión opcional: usuario autenticado, usuario propietario, amistades y subred cuando estén disponibles.

### Salida

- `items`: negocio visible con `legacyId`, slug, título, resumen, ubicación no sensible según política, categoría, flags de destacado/patrocinado y contadores públicos permitidos.
- `page`, `pageSize`, `total`, `hasNextPage`.
- No incluir `business_desc` HTML sin sanitizar, datos de pago, campos dinámicos no autorizados, tokens, email del propietario ni rutas internas de uploads.

### Errores y autorización

- Parámetros inválidos: respuesta de validación sin consultar con SQL construido desde entrada.
- Usuario anónimo o autenticado: solo ve filas que cumplen el filtro público y la máscara de privacidad correspondiente.
- La UI no decide visibilidad; el servicio de dominio debe aplicar aprobación, expiración, búsqueda y privacidad server-side.
- Negocio inexistente, no aprobado, expirado o no visible: tratar como no encontrado/no visible sin filtrar cuál condición falló.

## Mapeo de diseño, aún no implementado

| Legacy | Destino propuesto | Decisión |
|---|---|---|
| `se_businesses.business_id` | `Business.legacyId` + ID interno | Conservar entero para trazabilidad; definir relación a `User` tras confirmar tabla de correspondencia de usuarios |
| `business_user_id` | `Business.ownerId` | Obligatorio y protegido por autorización; no se puede enlazar hasta resolver IDs de usuario |
| campos de fecha Unix | `DateTime` nullable/semántico | `0` en expiración significa `null`; documentar timezone UTC |
| `business_approved`, `business_search`, flags | Booleanos separados | Convertir solo tras validación de valores fuera de 0/1 |
| `business_privacy`, `business_comments` | `Int`/bitmask | No usar enum; preservar bits y probar equivalencia |
| categoría y tipo | tablas catálogo con `legacyId` | Resolver títulos de idioma aparte; no copiar IDs de idioma como texto |
| ubicación textual | columnas separadas y eventualmente `GeoLocation` | No activar PostGIS ni geocodificación hasta confirmar necesidad y proveedor |
| `business_tags` / `se_businesstags` | tabla `BusinessTag` | Requiere reconciliación de fuente y normalización; no migrar automáticamente todavía |
| rating cache / ratings | cache + relación opcional | Fuera del primer catálogo; validar contra `se_businessratings` antes de exponerlo |
| photo/uploads | metadatos y storage privado | Fuera del primer catálogo; no copiar rutas ni archivos reales |

No se añade todavía este mapeo a `packages/db/schema.prisma`: faltan la correspondencia de IDs de usuarios, la resolución de idioma, la política exacta de subred y la decisión sobre tags dinámicos. Crear modelos ahora produciría relaciones o restricciones no verificadas.

## Riesgos de datos y migración

- `docs/se.sql` contiene `INSERT` con datos potencialmente reales, PII, HTML y configuraciones sensibles. No se ejecuta, no se parsea para fixtures y no se incluye en Prisma.
- Hay serialización PHP en `businesstype_tabs`, opciones de campos y máscaras de niveles. Debe transformarse con parser controlado y fixtures sintéticos, nunca con `unserialize` inseguro sobre entrada no confiable.
- Las longitudes MySQL, collations y comparación case-insensitive (`utf8_unicode_ci`) no equivalen automáticamente a PostgreSQL. Revisar slug, tag y búsqueda antes de imponer índices unique.
- El orden por `RAND()` en destacados de `businesses.php` no forma parte del contrato paginado estable del primer catálogo.
- Pagos, claims, módulos, mapas, uploads, ratings y comentarios quedan explícitamente pendientes.

## Siguiente paso seguro

1. Confirmar la instalación efectiva: IDs de usuarios, tablas de idioma, tablas de amistad/subred y valores de configuración activos, sin exportar PII.
2. Añadir un contrato de dominio de solo lectura y una matriz de casos para anonimato, propietario, registrado, amigo, segundo grado, subred, aprobado y expirado.
3. Diseñar modelos Prisma en una revisión separada, con `legacyId`, índices de filtros/paginación y relaciones `onDelete` explícitas.
4. Crear migración expand-only y un extractor dry-run que emita conteos y errores agregados, no filas ni valores sensibles.
5. Implementar API/UI únicamente después de validar el contrato contra fixtures sintéticos y la evidencia legacy.

## Criterio de cierre de este inventario

- Esquema de las tablas núcleo confirmado desde `docs/se.sql`.
- Diferencia entre tablas referenciadas y tablas realmente definidas documentada.
- Catálogo público delimitado sin afirmar paridad completa del módulo.
- No se modificaron `docs/legacy`, PHP/MySQL, `.env`, `packages/db/schema.prisma` ni datos reales.
