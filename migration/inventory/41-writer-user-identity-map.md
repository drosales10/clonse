# Incremento 41 — Writer interno idempotente de UserIdentityMap

## Estado

Preparado el caso de uso interno para registrar mappings aprobados sin exponer una API pública, sin añadir un CLI mutante y sin ejecutarlo contra datos reales. La base sigue sin mappings importados.

## Archivos

- Contrato y validación: `packages/domain/src/identity-map.ts`.
- Writer server-side: `src/server/identity-map/writer.ts`.
- Resolución de lectura existente: `src/server/identity-map/repository.ts`.
- Dry-run de entrada: `migration/scripts/user-identity-map-dry-run.mjs`.

El writer no se importa desde `src/app/api`, páginas React, Server Actions públicas ni scripts CLI. Solo queda disponible para un futuro reconciliador interno revisado.

## Entrada aceptada

El caso de uso `writeApprovedIdentityMapping` solo admite mappings aprobados con:

- `sourceSystem` y `sourceTable` no vacíos;
- `legacyUserId` entero positivo;
- `userId` destino no vacío;
- `status` `active` o `merged`;
- `canonicalUserId` obligatorio para `merged`;
- `canonicalUserId` ausente para `active`;
- `reasonCode` opcional para mappings aprobados.

Los estados `unresolved` y `excluded` siguen siendo estados de reconciliación, pero no se escriben mediante este writer de aprobaciones. Deben llegar por un flujo de cuarentena/revisión separado.

## Comportamiento transaccional

Cada operación utiliza `db.$transaction` y:

1. comprueba que `userId` exista;
2. para `merged`, comprueba que exista `canonicalUserId`;
3. rechaza un merge cuyo canónico sea el mismo usuario origen;
4. busca el mapping por `(sourceSystem, sourceTable, legacyUserId)`;
5. devuelve `unchanged` si todos los campos son idénticos;
6. devuelve conflicto si el legacy ya apunta a otro usuario o estado;
7. comprueba la unicidad del destino por `(userId, sourceSystem, sourceTable)`;
8. crea una sola fila con `importedAt` si no existe;
9. convierte una carrera de unicidad en `concurrent-write`, sin filtrar valores.

No actualiza mappings existentes silenciosamente. Cambios de propietario, estado, merge o motivo requieren un flujo de revisión explícito.

## Resultado sin PII

El writer solo devuelve:

```text
created
unchanged
invalid + código técnico
conflict + código técnico
```

Códigos principales:

- `destination-user-not-found`;
- `canonical-user-not-found`;
- `canonical-user-equals-source`;
- `legacy-reference-already-mapped`;
- `destination-already-mapped`;
- `concurrent-write`.

No devuelve email, username, display name, filas Prisma completas, IDs legacy en logs ni payload de entrada.

## Seguridad operativa

- No se ejecutó el writer durante este incremento.
- No se añadieron endpoints ni comandos de importación mutante.
- No se insertaron mappings en PostgreSQL.
- No se accedió a MySQL/PHP ni se modificó legacy.
- La fuente debe pasar primero por `pnpm migration:identity:dry-run` y aprobación humana/operativa.
- El futuro reconciliador debe usar una fuente autorizada, una transacción controlada, reportes agregados y cuarentena de errores.

## Validación ejecutada

- `pnpm exec tsc --noEmit` ✅
- `pnpm exec eslint packages/domain/src/identity-map.ts src/server/identity-map/repository.ts src/server/identity-map/writer.ts` ✅
- `pnpm build` ✅
- `git diff --check` ✅; Windows informa únicamente normalización LF/CRLF.

No se ejecutó un smoke test de escritura porque hacerlo requeriría crear datos sintéticos en PostgreSQL; la política de este incremento es dejar el writer preparado, pero no ejecutar ninguna mutación.

## Pendientes

1. Definir y revisar el reconciliador que llamará al writer.
2. Añadir un smoke test aislado con una base de pruebas explícita, nunca contra la base local de trabajo sin autorización.
3. Implementar workflow de cuarentena para `unresolved` y `excluded`.
4. Añadir auditoría agregada de quién aprobó cada mapping sin almacenar PII en reportes.
5. Integrar transformadores de entidades solo después de confirmar mappings y conteos.
