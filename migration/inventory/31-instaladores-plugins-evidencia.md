# Incremento 31 — Inventario de instaladores de plugins

## Resultado

`docs/Plugins install` contiene 40 instaladores PHP de plugins SocialEngine/Radcodes. Es una fuente útil para complementar el dump y la documentación funcional porque registra:

- nombre, versión y tipo del plugin;
- menús y páginas administrativas;
- permisos por nivel;
- rutas rewrite;
- charset y collation esperados;
- requisitos de plugins externos;
- creación/actualización de tablas mediante `CREATE TABLE` dentro del instalador;
- índices y valores iniciales cuando aparecen en el código.

No se ejecutó ningún instalador ni se leyó/importó información de datos.

## Plugins relevantes encontrados

- `install_business.php`
- `install_classified.php`
- `install_event.php`
- `install_group.php`
- `install_blog.php`
- `install_gstore.php`
- `install_poll.php`
- `install_album.php`
- `install_article.php`
- `install_page.php`
- `install_job.php`
- `install_employment.php`
- `install_game.php`
- `install_video.php`
- `install_vid.php`
- `install_music.php`
- `install_chat.php`
- `install_geo.php`
- `install_gmap.php`
- `install_epayment.php`
- `install_campaigns.php`
- `install_userpoints.php`
- `install_apps.php`
- `install_theme.php`
- `install_rssfeed.php`
- `install_scheduler.php`
- `install_radcodes.php`
- otros plugins sociales y auxiliares.

## Utilidad por dominio

### Alta utilidad

Los instaladores de negocios, clasificados, eventos, grupos, blogs y G-Store son útiles para:

- contrastar `CREATE TABLE` del dump;
- identificar diferencias de versión;
- comprobar tablas auxiliares que el dump o el código principal no hicieron evidentes;
- recuperar índices, collation y defaults históricos;
- documentar páginas administrativas, permisos y rutas;
- saber si el dominio depende de otro plugin.

`install_group.php` confirma metadatos del plugin, charset/collation y rutas de grupos, álbumes y discusiones; además contiene creación de tablas de grupos dentro del instalador.

`install_event.php` confirma rutas de eventos y álbumes, ajustes de nivel y la descripción funcional de invitaciones/RSVP.

`install_classified.php` confirma catálogo por usuario, marketplace, categorías y ajustes por nivel.

`install_blog.php` confirma entradas por usuario y trackback.

### Utilidad condicionada

`install_epayment.php` es útil para documentar gateways, logs, transacciones, settings y dependencia de Radcodes, pero no debe usarse para inventar integraciones activas ni para leer credenciales o payloads de pago.

Los instaladores de mapas, vídeo, RSS, campañas, puntos, apps y tiendas requieren además sus clases, callbacks, configuración efectiva y tablas completas antes de diseñar destino.

## Foro independiente

No existe `install_forum.php` en este directorio. Tampoco se encontró un archivo `.sql` o `.xml` de instalación del foro independiente.

El código de `docs/legacy/include/forum/` sigue siendo evidencia de comportamiento, pero no hay aquí una fuente de esquema suficiente para confirmar las tablas `Instance`, `Category`, `Topic`, `Post`, `Ranking` u otras del foro.

Por tanto:

- el instalador sirve para grupos SocialEngine;
- no desbloquea todavía el modelo Prisma del foro independiente;
- se necesita el instalador original del foro, su SQL de instalación o un dump que contenga las tablas efectivas;
- no se deben convertir nombres de modelos PHP en tablas PostgreSQL por suposición.

## Regla de uso seguro

Los instaladores se usarán como evidencia de esquema y configuración estática, pero:

- no se ejecutarán contra MySQL real;
- no se copiarán `INSERT` con datos, credenciales o PII;
- no se importarán defaults serializados sin documentar el formato;
- no se tratarán versiones del instalador como prueba de que el plugin está activo;
- se compararán siempre con `docs/se.sql` y el código PHP efectivo;
- cualquier diferencia entre dump, instalador y código se marcará como discrepancia.

## Siguiente paso

Para los próximos catálogos, los instaladores ya encontrados permiten hacer el mismo trabajo realizado con negocios, clasificados y eventos con mayor trazabilidad. El siguiente lote puede usar `install_blog.php` para contrastar tablas y rutas de blogs.

Para el foro, avisar al usuario únicamente si consigue el instalador/SQL específico del plugin o un dump que contenga sus tablas.
