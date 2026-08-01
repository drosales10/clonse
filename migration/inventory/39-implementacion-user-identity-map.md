# Incremento 39 — Correspondencia explícita de usuarios legacy

## Estado

Implementada la estructura nativa para relacionar usuarios legacy de SocialEngine con usuarios internos de PostgreSQL/Prisma. Este incremento no importa usuarios, no crea mappings, no modifica PHP/MySQL y no contiene datos reales.

## Decisión de identidad

Se mantienen separados:

1. `User.id`: identificador interno Prisma y autoridad de todas las relaciones destino.
2. `se_users.user_id`: identificador entero legacy, usado únicamente como referencia de migración y trazabilidad.
3. Username/email/slug: identificadores de navegación o cuenta, nunca claves de correspondencia ni autorización.

No se permite resolver usuarios por email, username, display name, contraseña, hash o similitud aproximada.

## Modelo destino

`UserIdentityMap` se encuentra en `packages/db/schema.prisma` y se persiste en `user_identity_maps`.

| Campo | Propósito |
|---|---|
| `userId` | FK al `User.id` interno |
| `sourceSystem` | Fuente, por ejemplo `socialengine-3` |
| `sourceTable` | Tabla de origen, por ejemplo `se_users` |
| `legacyUserId` | ID entero positivo de la fuente |
| `status` | `active`, `unresolved`, `merged` o `excluded` |
| `reasonCode` | Código técnico agregado de reconciliación |
| `canonicalUserId` | Usuario canónico explícito para mappings `merged` |
| `importedAt` | Momento opcional de importación controlada |
| `createdAt`/`updatedAt` | Auditoría del mapping |

Restricciones:

- `UNIQUE(sourceSystem, sourceTable, legacyUserId)` evita dos destinos para el mismo usuario legacy.
- `UNIQUE(userId, sourceSystem, sourceTable)` evita mappings duplicados del mismo usuario y fuente.
- `userId` usa `ON DELETE RESTRICT` para conservar trazabilidad y evitar borrar un usuario con correspondencias sin decisión explícita.
- `canonicalUserId` usa `ON DELETE SET NULL`; un merge incompleto no se convierte silenciosamente en una resolución activa.
- No se acepta `legacyUserId = 0`, negativo o ausente en la capa de dominio.

## Migración

```text
packages/db/prisma/migrations/20260802130000_user_identity_map/migration.sql
```

Es una migración expand-only. Crea tabla, índices y FKs; no inserta mappings, no ejecuta backfill, no copia `se_users` y no toca el legacy.

## Contrato de dominio

`packages/domain/src/identity-map.ts` contiene:

- constantes de fuente y estados;
- validación de `sourceSystem`, `sourceTable` e ID entero positivo;
- resolución de estados:
  - `active` → `User.id` interno;
  - `merged` → `canonicalUserId` explícito;
  - `unresolved`/`excluded` → referencia inactiva;
  - `merged` sin canónico → referencia inactiva;
- resultados tipados sin emails, usernames, nombres ni filas completas.

## Repositorio server-side

`src/server/identity-map/repository.ts` expone `resolveLegacyUserReference`.

El repositorio:

1. normaliza y valida la referencia;
2. consulta únicamente por `(sourceSystem, sourceTable, legacyUserId)`;
3. selecciona solo `status`, `userId` y `canonicalUserId`;
4. devuelve `User.id` únicamente si el mapping es activo o tiene canónico explícito;
5. devuelve códigos `invalid-reference`, `missing-reference` o `inactive-reference` sin filtrar PII;
6. no crea, actualiza ni elimina mappings;
7. no comprueba permisos de dominio ni sustituye el `ViewerContext`.

La escritura de mappings debe pertenecer a un importador/reconciliador controlado, idempotente y separado de Route Handlers públicos. Las referencias ausentes deben ir a cuarentena agregada antes de crear relaciones dependientes.

## Validación ejecutada

- `pnpm prisma validate` ✅
- `pnpm prisma generate` ✅
- `pnpm prisma migrate deploy` ✅
- `pnpm prisma migrate status` ✅
- `pnpm exec tsc --noEmit` ✅
- `pnpm exec eslint packages/domain/src/identity-map.ts src/server/identity-map/repository.ts` ✅
- `pnpm build` ✅
- `git diff --check` ✅; Windows informa únicamente normalización LF/CRLF.

## Pendientes explícitos

1. Confirmar la estructura efectiva de `se_users` y la fuente de verdad autorizada antes de importar.
2. Crear un importador dry-run que emita conteos, códigos y relaciones agregadas, nunca PII.
3. Definir el flujo de creación y revisión de mappings `active`, `unresolved`, `merged` y `excluded`.
4. Añadir cuarentena para referencias `0`, ausentes, duplicadas o sin usuario destino.
5. Integrar el mapping en transformadores de negocios, clasificados, eventos, grupos, amistades y membresías.
6. Construir `ViewerContext` con niveles, subredes y categorías de perfil cuando sus catálogos estén modelados.
7. No declarar paridad de importación hasta reconciliar conteos y relaciones contra una fuente legacy autorizada.
