# Incremento 40 — Dry-run de UserIdentityMap

## Estado

Implementado un validador reproducible de candidatos de correspondencia de usuarios legacy. El proceso es exclusivamente `dry-run`: no usa Prisma, no se conecta a PostgreSQL, no escribe archivos, no modifica PHP/MySQL y no crea mappings.

## Ejecución

Modo de autocomprobación sintética:

```text
pnpm migration:identity:dry-run -- --self-check
```

Entrada JSONL autorizada:

```text
pnpm migration:identity:dry-run -- --input <archivo.jsonl>
```

La salida se emite como un único documento JSON agregado por stdout. No se crea un reporte persistente automáticamente.

El tamaño máximo de entrada es 10 MiB. Las líneas vacías se ignoran. Una línea JSON inválida se envía a cuarentena como error agregado sin mostrar su contenido.

## Formato aceptado

Cada línea debe contener únicamente campos de correspondencia no sensibles:

```json
{"sourceSystem":"socialengine-3","sourceTable":"se_users","legacyUserId":101,"userId":"destino-opaco-1","status":"active"}
{"sourceSystem":"socialengine-3","sourceTable":"se_users","legacyUserId":102,"userId":"destino-opaco-2","status":"merged","canonicalUserId":"destino-opaco-3"}
{"sourceSystem":"socialengine-3","sourceTable":"se_users","legacyUserId":103,"userId":"destino-opaco-4","status":"unresolved","reasonCode":"missing-destination-user"}
```

Campos permitidos:

- `sourceSystem`;
- `sourceTable`;
- `legacyUserId`;
- `userId`;
- `status` (`active`, `unresolved`, `merged`, `excluded`);
- `canonicalUserId`;
- `reasonCode`.

El script exige IDs legacy enteros positivos, `userId` para todas las filas, `canonicalUserId` para `merged` y `reasonCode` para `unresolved`/`excluded`. La unicidad se comprueba por `(sourceSystem, sourceTable, legacyUserId)` dentro de la entrada.

## Cuarentena agregada

El resultado no contiene valores de filas ni líneas problemáticas. Solo incluye contadores por código:

- `record-not-object`;
- `unknown-field`;
- `pii-field-present`;
- `invalid-source-system`;
- `invalid-source-table`;
- `non-positive-legacy-user-id`;
- `missing-destination-user-id`;
- `invalid-status`;
- `merged-without-canonical-user-id`;
- `inactive-without-reason-code`;
- `duplicate-source-reference`.

También resume cantidades por estado y fuente, pero no incluye IDs, emails, usernames, nombres ni payloads.

## Garantías de privacidad y no escritura

`migration/scripts/user-identity-map-dry-run.mjs`:

- no importa `@prisma/client`;
- no lee `.env` ni `DATABASE_URL`;
- no abre conexiones de red o base de datos;
- no ejecuta `INSERT`, `UPDATE`, `DELETE`, migraciones ni backfills;
- no crea directorios ni archivos de salida;
- rechaza campos sensibles como email, username, display name, nombre, contraseña, hash, token, teléfono;
- no imprime valores de entrada, ni siquiera para filas inválidas;
- devuelve flags explícitos `database: false`, `files: false`, `legacy: false`.

La fuente debe prepararse fuera del repositorio a partir de una copia autorizada y sin PII. No se deben versionar dumps, exports reales ni archivos JSONL con emails, nombres o credenciales.

## Validación ejecutada

- `pnpm migration:identity:dry-run -- --self-check` ✅; 4 registros sintéticos, 3 válidos y 1 en cuarentena por ID no positivo.
- `pnpm migration:identity:dry-run -- --help` ✅
- `pnpm exec eslint migration/scripts/user-identity-map-dry-run.mjs` ✅
- `pnpm exec tsc --noEmit` ✅
- `pnpm build` ✅
- `git diff --check` ✅; Windows informa únicamente normalización LF/CRLF.

## Límites y siguiente paso

Este script valida la forma y consistencia de una propuesta de mapping; no demuestra que el `userId` exista en PostgreSQL ni decide identidades. Esa verificación debe realizarse en un reconciliador controlado, con acceso autorizado, transacción separada y reporte agregado.

El siguiente paso será diseñar la escritura idempotente de mappings después de revisar una entrada autorizada y aprobar reglas de duplicados, merges, cuarentena y usuarios excluidos. Nunca debe convertirse este script en un importador mutante por añadir una opción de línea de comandos.
