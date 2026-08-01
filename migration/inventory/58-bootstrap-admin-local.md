## Estado

Creado el primer administrador en PostgreSQL local usando exclusivamente `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD` del `.env`. Los valores no se imprimen, no se escriben en código y no se incluyen en la documentación.

## Procedimiento

1. Verificar el estado sin mostrar secretos:

   ```powershell
   pnpm exec prisma migrate status
   ```

2. Aplicar migraciones únicamente contra el destino local verificado:

   ```powershell
   pnpm exec prisma migrate deploy
   ```

3. Ejecutar el bootstrap idempotente:

   ```powershell
   pnpm exec node migration/scripts/admin-bootstrap.mjs
   ```

El script lee las variables mediante `dotenv`, normaliza el email a minúsculas y usa ese valor como `Admin.email` y `Admin.username`. La parte local del email se usa como `displayName`. La contraseña se transforma en memoria al formato scrypt del destino. La operación usa `upsert` por email: repetirla no duplica administradores y actualiza la credencial proporcionada.

La cuenta queda `enabled=true` e `isSuperAdmin=true` porque corresponde al bootstrap inicial explícitamente autorizado. Esta decisión no se presenta como una regla general de importación de `se_admins`.

## Verificación sin exposición de secretos

El script `migration/scripts/admin-bootstrap-verify.mjs` solo emite:

- cantidad total de administradores;
- cantidad de administradores habilitados y superadministradores;
- booleano de coincidencia del password contra el hash almacenado.

Resultado local observado:

```text
adminCount=1
enabledSuperAdminCount=1
passwordMatches=true
```

No se imprimieron email, username, password, hash, cookie ni PII.

## Comprobación HTTP

La build se levantó de forma aislada en `http://localhost:3003`.

- `GET /admin/login` respondió `200`.
- `GET /admin/dashboard` sin cookie administrativa respondió `307` con `Location: /admin/login`.
- El endpoint protegido no expone el dashboard a visitantes.

La autenticación directa se verificó contra el hash mediante el verificador local. No se automatizó un login de navegador ni se guardaron cookies de prueba.

## Archivos

- `migration/scripts/admin-bootstrap.mjs`: bootstrap idempotente, sin secretos.
- `migration/scripts/admin-bootstrap-verify.mjs`: verificación booleana y de conteos, sin salida sensible.
- `packages/db/schema.prisma`: autoridad `Admin`/`AdminSession`.
- `packages/db/prisma/migrations/20260802170000_admin_authority/migration.sql`: migración aditiva ya aplicada localmente.

## Seguridad y límites

- El script requiere las dos variables y falla si faltan.
- No contiene valores por defecto ni crea credenciales aleatorias que el usuario no pueda conocer.
- No modifica PHP/MySQL ni `docs/legacy`.
- No importa administradores legacy adicionales.
- Para otro entorno se debe revisar el destino, aplicar migraciones de forma controlada y proporcionar secretos por variables de entorno; no copiar `.env` ni ejecutar el bootstrap sobre producción sin autorización explícita.
