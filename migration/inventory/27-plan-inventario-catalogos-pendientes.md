# Incremento 27 — Plan de inventario de catálogos legacy pendientes

## Objetivo

Aplicar al resto de catálogos el mismo método usado en `26-catalogo-publico-negocios-esquema.md`:

1. confirmar tablas mediante `CREATE TABLE` en `docs/se.sql`;
2. seguir entrada PHP → autorización → consultas → plantillas/AJAX → efectos secundarios;
3. documentar columnas, tipos, nullabilidad, claves, índices, collation y serialización;
4. definir el contrato observable y sus límites de privacidad;
5. proponer el mapeo PostgreSQL/Prisma sin implementarlo hasta cerrar la evidencia.

La presencia de una tabla en el dump confirma esquema histórico, pero no demuestra que el módulo esté activo ni que sus datos correspondan a la instalación actual.

## Familias confirmadas por nombre de tabla en `docs/se.sql`

El dump contiene tablas para estas familias:

- Identidad y configuración: `se_users`, `se_usersettings`, `se_levels`, `se_subnets`, `se_settings`, `se_languages`, `se_languagevars`.
- Perfil y actividad: `se_profilecats`, `se_profilefields`, `se_profilevalues`, `se_actions`, `se_actiontypes`, `se_actionmedia`, `se_profilecomments`, `se_profileviews`, `se_notifys`, `se_notifytypes`.
- Blogs: `se_blogentries`, `se_blogentrycats`, `se_blogcomments`, `se_blogsubscriptions`, `se_blogpings`, `se_blogtrackbacks`, `se_blogstyles`.
- Clasificados: `se_classifieds`, `se_classifiedcats`, `se_classifiedfields`, `se_classifiedvalues`, `se_classifiedalbums`, `se_classifiedmedia`, `se_classifiedcomments`, `se_classifiedstyles`.
- Eventos: `se_events`, `se_eventcats`, `se_eventfields`, `se_eventvalues`, `se_eventmembers`, `se_eventalbums`, `se_eventmedia`, `se_eventcomments`, `se_eventmediacomments`, `se_eventmediatags`, `se_eventstyles`.
- Grupos y foros: `se_groups`, `se_groupcats`, `se_groupfields`, `se_groupvalues`, `se_groupmembers`, `se_groupsubscribes`, `se_groupalbums`, `se_groupmedia`, `se_groupcomments`, `se_groupmediacomments`, `se_groupmediatags`, `se_grouptopics`, `se_groupposts`, `se_groupstyles`.
- Tiendas: `se_gstores`, `se_gstorecats`, `se_gstorefields`, `se_gstorevalues`, `se_gstorealbums`, `se_gstoremedia`, `se_gstorecomments`, `se_gstore_settings`.
- Multimedia y encuestas: `se_albums`, `se_albumstyles`, `se_media`, `se_mediacomments`, `se_mediatags`, `se_polls`, `se_pollcomments`, `se_videos`, `se_videocomments`, `se_videoratings`, `se_music`, `se_xspfskins`.
- Monetización y administración: `se_ads`, `se_announcements`, `se_epaymentgateways`, `se_epaymentlogs`, `se_epaymenttransactions`, tablas `se_semods_*`, puntos y campañas.
- Comunicación y moderación: `se_pmconvos`, `se_pmconvoops`, `se_pms`, `se_friends`, `se_friendexplains`, `se_reports`, chat y presencia.

No se usa ninguna tabla de etiquetas de grupos en el siguiente lote hasta comprobar su uso en el código legacy y sus columnas exactas.

## Priorización

### Lote 1 — Catálogos verticales de contenido

Inventariar uno por uno, en este orden:

1. **Clasificados** — `se_classifieds`, categorías, campos dinámicos, valores, medios y comentarios.
2. **Eventos** — `se_events`, categorías, miembros/RSVP, campos, medios y comentarios.
3. **Grupos y foros** — grupos, categorías, membresías, temas y posts.
4. **Blogs** — entradas, categorías, comentarios, suscripciones y trackbacks.
5. **Tiendas** — solo después de confirmar si `gstore` es catálogo público o flujo de comercio/pago activo.
6. **Encuestas** — `se_polls` y votos/comentarios, si el código y permisos siguen activos.

Cada inventario debe comenzar por el catálogo público/lectura y dejar creación, edición, archivos, comentarios y pagos como subflujos separados.

### Lote 2 — Catálogos compartidos

- Categorías y campos dinámicos reutilizables.
- Niveles, subredes y permisos efectivos.
- Idiomas y variables de idioma.
- Configuración de módulo y estilos.
- Álbumes, media y etiquetas comunes.

Este lote es necesario para resolver títulos traducibles, campos dinámicos, máscaras de privacidad y límites por nivel. No debe traducirse directamente a enums o booleanos sin revisar valores efectivos.

### Lote 3 — Monetización y extensiones

- Gateways, transacciones y logs de pago.
- Puntos, planes, carritos y tareas Semods.
- Anuncios, campañas y anuncios globales.
- Plugins, apps, hooks, notificaciones y páginas.
- Chat, correo, RSS, mapas y vídeo.

Este lote queda después porque puede contener secretos, payloads serializados, callbacks externos, archivos privados o configuración que no debe copiarse al destino.

## Regla de creación de inventarios

Cada catálogo tendrá un archivo independiente `migration/inventory/<n>-<dominio>-esquema.md` y deberá incluir:

- tablas confirmadas y tablas solo referenciadas;
- entrada, parámetros GET/POST, respuestas y redirecciones;
- actores y autorización server-side;
- filtros, orden y paginación observados;
- estados, errores y efectos secundarios;
- tablas destino candidatas y correspondencia de IDs;
- Unix timestamps, flags, bitmasks, HTML, CSV y PHP serialization;
- archivos/uploads y límites de privacidad;
- riesgos de PII y datos que no se deben versionar;
- criterio de evidencia y pendientes explícitos.

## Límites de seguridad

- Leer solo definiciones SQL, nunca importar el dump ni generar fixtures desde `INSERT`.
- No modificar `docs/legacy`, PHP/MySQL, `.env` ni configuraciones existentes.
- No crear modelos Prisma, migraciones ni backfills como parte del inventario.
- No afirmar que una familia está activa solo porque existe en el dump o en el código.
- No publicar títulos de idioma, emails, credenciales, HTML real, uploads, transacciones ni payloads de proveedores.
- Toda relación a `User` debe esperar una estrategia verificada para convertir IDs enteros legacy a los IDs `String` del destino.

## Próximo lote recomendado

El siguiente inventario debe ser **clasificados**, porque el dump confirma su familia completa y comparte con negocios el patrón de categoría, campos dinámicos, valores, álbumes, medios y privacidad. Debe limitarse inicialmente a catálogo público aprobado/no expirado, búsqueda, categoría, ubicación, paginación y ownership; no incluir todavía creación, uploads, pagos o comentarios.

Después se puede reutilizar la matriz de negocios como plantilla para eventos y grupos, pero cada dominio debe comprobar sus propias reglas de membresía, RSVP, privacidad, moderación y efectos secundarios.

## Criterio de cierre del plan

Este documento prioriza el trabajo, pero no declara paridad ni confirma el comportamiento de cada familia. Cada catálogo deberá cerrarse con su propio inventario, evidencia SQL/PHP y pendientes antes de pasar a Prisma o a una implementación Next.js.
