# Incremento 28 — Inventario de clasificados y catálogo de lectura

## Estado

El módulo legacy está presente en `docs/legacy`; no es necesario solicitar archivos adicionales para cerrar este inventario inicial. Se revisaron entrypoints públicos, detalle, propietario, clase de dominio, funciones transversales y administración.

Archivos principales:

- `docs/legacy/browse_classifieds.php`
- `docs/legacy/classifieds.php`
- `docs/legacy/classified.php`
- `docs/legacy/include/class_classified.php`
- `docs/legacy/include/functions_classified.php`
- `docs/legacy/user_classified_listing.php`
- `docs/legacy/user_classified_media.php`
- `docs/legacy/user_classified_settings.php`
- `docs/legacy/classified_ajax.php`
- `docs/legacy/admin/admin_viewclassifieds.php`
- `docs/legacy/admin/admin_classified.php`
- `docs/legacy/admin/admin_levels_classifiedsettings.php`
- plantillas `classified*.tpl`, `user_classified*.tpl` y `admin*classified*.tpl`

## Tablas confirmadas en `docs/se.sql`

- `se_classifieds`
- `se_classifiedcats`
- `se_classifiedfields`
- `se_classifiedvalues`
- `se_classifiedalbums`
- `se_classifiedmedia`
- `se_classifiedcomments`
- `se_classifiedstyles`

Dependencias observadas: `se_users`, `se_levels`, `se_friends`, `se_notifys`, `se_notifytypes` y el sistema común de campos dinámicos/idiomas. Las relaciones no son foreign keys en MyISAM y deben modelarse explícitamente en destino.

## Esquema núcleo

### `se_classifieds`

- `classified_id`: `int(10) unsigned`, autoincremental, primary key.
- `classified_user_id`, `classified_classifiedcat_id`: `int(10) unsigned NOT NULL`, default `0`.
- `classified_date`, `classified_dateupdated`: `int(11) NOT NULL`, default `0`; son timestamps Unix.
- `classified_views`: contador `int(10) unsigned`, default `0`.
- `classified_title`: `varchar(128) NOT NULL`, default vacío.
- `classified_body`: `text` nullable; el legacy guarda HTML filtrado/escapado y lo decodifica al presentar.
- `classified_photo`: `varchar(16) NOT NULL`, default vacío.
- `classified_search`, `classified_privacy`, `classified_comments`: `tinyint(3) unsigned NOT NULL`, default `0`.
- `classified_totalcomments`: `smallint(5) unsigned NOT NULL`, default `0`.
- Índices: PK por ID, índice `(classified_user_id, classified_classifiedcat_id)` y FULLTEXT sobre `(classified_title, classified_body)`.
- Collation: `utf8_unicode_ci`, engine MyISAM.

### Categorías y campos

`se_classifiedcats` confirma jerarquía mediante `classifiedcat_dependency`, título como ID de idioma, orden y flag de signup.

`se_classifiedfields` contiene definición dinámica: categoría, dependencia, orden, tipo, longitud, opciones `longtext`, regex, HTML, flags de búsqueda/signup/display y texto de estilo.

`se_classifiedvalues` solo tiene PK y `classifiedvalue_classified_id` indexado en el dump. El código puede escribir columnas dinámicas `classifiedvalue_<field_id>`, por lo que no se debe convertir a un modelo fijo sin inventariar las filas de campos y los ALTER/columnas efectivos de la instalación.

### Medios, álbumes, comentarios y estilos

- `se_classifiedalbums`: álbum por clasificado, fechas Unix, privacidad/comentarios, portada, contadores y espacio.
- `se_classifiedmedia`: archivo asociado a álbum, fecha Unix, título, descripción, extensión y tamaño.
- `se_classifiedcomments`: clasificado, autor, fecha Unix y cuerpo, con índice por clasificado/autor.
- `se_classifiedstyles`: CSS por usuario; no pertenece al catálogo público inicial y debe tratarse como HTML/CSS no confiable.

## Comportamiento observado

### Catálogo `browse_classifieds.php`

- La página exige `setting_permission_classified` para visitantes/usuarios según configuración.
- Acepta `p`, `s`, `v`, `classifiedcat_id` y `classified_search` por GET o POST.
- Solo acepta estos órdenes: fecha de creación descendente, fecha de actualización descendente, vistas descendente o total de comentarios descendente. Cualquier otro valor vuelve al orden por fecha.
- `v=1` restringe a clasificados de amigos cuando existe sesión; otros valores se normalizan a `0`.
- La privacidad se evalúa con propietario, visitante registrado, anónimo, amigo, subred y segundo grado usando máscara de bits y relaciones `se_friends`/`se_users`.
- Una categoría raíz incluye la raíz y sus subcategorías; una subcategoría filtra solo esa categoría.
- Los campos dinámicos marcados como buscables agregan condiciones al filtro.
- La búsqueda textual usa FULLTEXT sobre título y cuerpo en modo booleano.
- La página devuelve 10 elementos por página y carga campos dinámicos junto al resultado.

### Detalle `classified.php`

- Carga el clasificado por ID y exige que exista y que el propietario exista.
- Evalúa `classified_privacy` y `classified_comments` mediante `owner->user_privacy_max(user)`.
- Incrementa vistas solo cuando el visitante puede ver el contenido.
- Carga hasta 10 archivos del álbum y hasta 10 comentarios.
- Resuelve categoría raíz/subcategoría y campos dinámicos.
- Al propietario le elimina avisos de comentarios del clasificado como efecto secundario contextual.
- Puede aplicar CSS personalizado según `level_classified_style`.

### Superficie del propietario

`classifieds.php` lista los clasificados de un propietario con privacidad y paginación basada en `level_classified_entries`.

`user_classified_listing.php` permite crear/editar solo al usuario actual cuando `level_classified_allow` está habilitado. Valida título y categoría, limita privacidad/comentarios a valores serializados permitidos por el nivel, fuerza búsqueda si el nivel no permite elegirla y crea valores/álbum/directorio al insertar.

La creación también actualiza `user_lastupdate` y genera una acción `postclassified`. Estos efectos quedan fuera del primer catálogo de lectura.

## Contrato inicial de lectura

### Entrada

- `page`: entero positivo, default 1.
- `categoryId`: entero positivo opcional.
- `sort`: unión cerrada `created`, `updated`, `views`, `comments`.
- `friendsOnly`: booleano; solo válido para usuario autenticado.
- `search`: texto acotado y validado server-side.
- Campos dinámicos buscables: solo después de resolver su definición y tipo; no aceptar nombres de columna desde el cliente.

### Filtro mínimo

1. El módulo está permitido por configuración.
2. El registro existe.
3. La máscara `classified_privacy` autoriza al visitante.
4. La categoría coincide con raíz/subcategoría solicitada.
5. `classified_search` y el nivel del propietario permiten inclusión en búsqueda, siguiendo la diferencia observada entre catálogo y búsqueda global.

A diferencia de negocios, el dump/código no muestra un estado de aprobado o expirado para clasificados. No debe inventarse ese filtro.

### Salida

Cada resultado puede exponer únicamente:

- ID legacy o identificador público controlado;
- título y cuerpo sanitizado;
- propietario público permitido;
- categoría y subcategoría resueltas;
- fecha de creación/actualización;
- vistas y total de comentarios según política;
- miniatura solo mediante adaptador de storage autorizado;
- campos dinámicos display autorizados.

No exponer HTML legacy sin sanitización, CSS personalizado, rutas internas, nombres originales de archivos, datos privados del propietario ni valores dinámicos no autorizados.

## Mapeo destino preliminar

| Legacy | Destino propuesto | Estado |
|---|---|---|
| `se_classifieds.classified_id` | `Classified.legacyId` + ID interno | Requiere estrategia de IDs |
| `classified_user_id` | relación `Classified.owner` | Requiere correspondencia usuario legacy → `User.id` |
| `classified_classifiedcat_id` | relación a categoría con `legacyId` | Candidato a `ClassifiedCategory` |
| fechas Unix | `DateTime` UTC | `0` solo significa ausencia cuando el campo lo permita |
| `classified_privacy/comments` | `Int` bitmask | No convertir a enum |
| `classified_search` | booleano tras validar valores | No asumir que solo contiene 0/1 sin revisión de datos |
| campos dinámicos | tabla de definiciones + valores JSON/normalizados | Requiere inventario de columnas efectivas |
| media/álbum | metadatos separados de storage | Fuera del primer catálogo |
| estilos CSS | storage/control separado | Fuera del primer catálogo y sanitización obligatoria |

No se modifica todavía `packages/db/schema.prisma`. El catálogo necesita resolver los IDs de usuarios, subredes, privacidad y campos dinámicos antes de imponer relaciones o constraints.

## Riesgos y pendientes

- El código construye SQL dinámico para campos y filtros; la implementación destino debe usar un mapa de campos permitido y parámetros tipados.
- Las máscaras de privacidad dependen de `se_users.user_subnet_id` y amistad; el destino actual todavía no tiene una entidad de subred equivalente.
- `se_classifiedvalues` no es portable como tabla de columnas desconocidas; no copiar serialización o columnas dinámicas sin inventario.
- FULLTEXT MySQL no equivale automáticamente a la búsqueda PostgreSQL; primero debe definirse la estrategia de búsqueda y su equivalencia aceptable.
- Las rutas `uploads_classified` y nombres de archivos no se migran como datos públicos.
- El borrado legacy elimina filas y archivos en varias operaciones sin transacción MyISAM; cualquier implementación moderna deberá usar transacción para metadatos y un proceso seguro para storage.
- El detalle limpia notificaciones del propietario; ese efecto secundario no pertenece al catálogo público y debe inventariarse aparte.
- No se confirma que el plugin esté habilitado actualmente; la evidencia confirma soporte en código y tablas históricas.

## Decisión de implementación

Existe evidencia suficiente para cerrar el inventario y diseñar el contrato de lectura, pero **no** para implementar aún un catálogo Next.js/Prisma completo sin inventariar:

1. correspondencia de usuarios y subredes;
2. definición efectiva de categorías/campos y columnas dinámicas;
3. estrategia de búsqueda equivalente a FULLTEXT;
4. adaptador seguro de miniaturas/storage;
5. contrato de privacidad compartido con el módulo de negocios.

Por tanto, el siguiente paso es cerrar esos contratos compartidos o inventariar el siguiente dominio con el mismo método. No se necesitan archivos adicionales del plugin para esta fase; se solicitarán solo si aparece un módulo externo, XML de instalación o comportamiento no presente en `docs/legacy`.
