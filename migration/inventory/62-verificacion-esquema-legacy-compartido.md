## Resultado de la verificación

No se encontró en el workspace actual un archivo `docs/se.sql` ni otro DDL local completo. El usuario aportó bloques `CREATE TABLE` para `se_levels`, `se_subnets`, `se_settings`, `se_users`, `se_profilefields` y `se_languagevars`, que permiten elevar esas tablas a evidencia DDL directa parcial. El DDL aportado es de una versión histórica y no demuestra que todas las columnas o plugins estén activos en la instalación actual.

La documentación histórica `migration/inventory/26-catalogo-publico-negocios-esquema.md` y `migration/inventory/27-plan-inventario-catalogos-pendientes.md` describe un dump phpMyAdmin de 2010 llamado `docs/se.sql` y enumera tablas observadas. Sin embargo, esa fuente no está disponible en el árbol actual para volver a inspeccionar sus `CREATE TABLE`; se trata de evidencia documental secundaria, no de una definición verificable presente.

## Comprobaciones realizadas

- Búsqueda de `se.sql`: sin resultados en el workspace.
- Búsqueda de archivos de instalación/SQL: sin resultados.
- Búsqueda de `CREATE TABLE` local para tablas compartidas: sin definiciones directas disponibles.
- DDL aportado por el usuario: confirma parcialmente `se_levels`, `se_subnets`, `se_settings`, `se_users`, `se_profilefields` y `se_languagevars`, incluyendo PK/índices, unicidad, tipos base, defaults, collation, engine y familias de columnas/reglas/configuración. La existencia de secretos, credenciales, PII o licencias queda documentada por nombre/tipo cuando procede, sin leer ni copiar valores.
- Búsqueda de referencias: consultas PHP e inventarios/documentación.
- No existe conexión configurada a MySQL legacy en el destino ni se intentó acceder a una base externa.

## Decisión

La evidencia DDL directa permite diseñar como siguiente incremento revisable los catálogos base `UserLevel`, `Subnetwork`, `Setting`, `User`, campos dinámicos y variables de idioma, incluyendo las relaciones conceptuales entre `se_users.user_level_id`, `se_users.user_subnet_id`, `se_users.user_profilecat_id`, `se_users.user_language_id`, `se_subnets.subnet_name` y `se_languagevars`.

Como fase de estructura-only ya se añadieron `UserLevel`, `Subnetwork`, `LanguageVariable` y el núcleo no sensible de `Setting` a `packages/db/schema.prisma`, junto con la migración aditiva `20260802180000_admin_catalog_structure`. La migración no contiene filas, secretos, imports ni FKs hacia `User` y fue aplicada localmente mediante `pnpm exec prisma migrate deploy` contra `clonse` en `localhost:5432`. `prisma migrate status` confirmó después que no quedan migraciones pendientes.

Esto no autoriza todavía importar filas, cambiar el modelo `User` existente, exponer filtros de nivel/subred o declarar paridad. La ausencia de foreign keys en el DDL MyISAM exige reconciliar IDs, defaults `0`, unicidad de email/username, idiomas, categorías y referencias antes de imponer restricciones PostgreSQL.

`se_profilefields.profilefield_options` y las máscaras/listas históricas requieren transformadores versionados. Los campos de contraseña, códigos, emails, IPs, blocklists, fotos y valores de idioma/contenido real no se copian a fixtures, logs ni reportes. Las licencias y API keys de `se_settings` siguen fuera del repositorio.

`se_settings` confirma los identificadores `setting_subnet_field1_id` y `setting_subnet_field2_id`, y los nuevos DDL permiten resolver el catálogo de campos, pero la evaluación de reglas todavía requiere inspección del código, filas autorizadas y pruebas controladas.

## Siguiente paso requerido

Se puede validar y aplicar localmente la migración de estructura-only para los catálogos, pero antes de añadir relaciones o una segunda migración deben definirse explícitamente:

1. la estrategia de IDs legacy y la representación de los valores `0`/fallback;
2. la normalización y unicidad de email/username, incluyendo case-folding;
3. la conversión de timestamps Unix y timezones;
4. los transformadores de `profilefield_options`, `user_blocklist`, privacidad/comentarios y demás serializaciones;
5. la resolución de variables de idioma con fallback y ausencia de primary key histórica;
6. la semántica de tipos, operadores y dependencias de reglas de subred;
7. permisos admin, auditoría, secretos separados y transacciones para mutaciones;
8. una fuente de filas autorizada, sin PII en el repositorio, y validadores idempotentes.

Hasta cerrar estos puntos no se ejecutan imports, backfills, CRUD mutante, filtros por nivel/subred ni FKs obligatorias. La evaluación de reglas y la paridad requieren comparación controlada con legacy.

## Invariantes preservadas

- No se modificó PHP/MySQL ni `docs/legacy`.
- No se leyeron ni versionaron filas, credenciales, uploads o PII.
- No se ejecutaron migraciones, imports, backfills ni operaciones destructivas.
- No se declaró paridad de niveles, subredes o configuración global.

## Implementación de estructura-only

La migración `packages/db/prisma/migrations/20260802180000_admin_catalog_structure/migration.sql` crea únicamente las tablas destino `user_levels`, `subnetworks`, `language_variables` y `settings`, con sus claves primarias e índices de correspondencia. El schema Prisma expone los campos no sensibles y conserva `legacyId` como puente de importación futura.

No se añadieron todavía relaciones `User.levelId`, `User.subnetworkId`, `User.profileCategoryId` o `User.languageId`, ni relaciones entre catálogos. Tampoco se incluyeron columnas completas de capacidades `level_*`, campos serializados, secretos/licencias de settings o datos reales. La migración debe validarse en una base local vacía/controlada y aplicarse mediante el flujo normal antes de implementar lecturas admin.

La evidencia de DDL está ahora suficiente para el diseño estructural, y la migración local quedó aplicada con las cuatro tablas vacías por diseño. Esto no permite declarar paridad de datos o comportamiento. El siguiente incremento debe ser la especificación de relaciones y un extractor/importador dry-run con fixtures sintéticos y logs sin PII; no un backfill real automático.

## Lectura administrativa de catálogos

La superficie admin ya expone lecturas protegidas para `/admin/levels`, `/admin/subnetworks` y `/admin/settings`. Las páginas son Server Components, validan `getAdminAccessState()` antes de consultar Prisma y redirigen a `/admin/login` cuando no hay sesión administrativa.

`src/server/admin/catalogs.ts` mantiene DTOs propios y selects cerrados:

- niveles: solo identidad, descripción y flags base;
- subredes: IDs, reglas textuales y tema, sin resolver contenido i18n;
- configuración: key/version, flags operativos no sensibles e IDs de campos de subred.

El estado actual de las cuatro tablas es vacío, por lo que las rutas muestran estados vacíos y no simulan paridad. No existen todavía acciones de creación/edición/eliminación, filtros por nivel/subred, relaciones con `User`, evaluación de operadores, resolución de nombres localizados ni exposición de secretos/licencias.

## Métricas de catálogo en dashboard

`src/server/admin/dashboard.ts` consulta de forma explícita seis conteos respaldados por destino: usuarios totales, usuarios habilitados, usuarios verificados, niveles, subredes y registros `Setting`. `/admin/dashboard` muestra estos valores y enlaza las tres lecturas de catálogo.

Los conteos de `UserLevel`, `Subnetwork` y `Setting` son actualmente `0` porque la migración structure-only no importó filas. Ese valor es una observación del estado destino, no una afirmación sobre el número legacy ni una autorización para hacer backfill. No se añadieron métricas de módulos, capacidades, relaciones por nivel/subred o estadísticas sin contrato verificable.
