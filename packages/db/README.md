# packages/db

Este paquete contiene el esquema Prisma y el acceso PostgreSQL de la vertical de acceso.

## Configuración

- Prisma está fijado a `7.9.1`.
- `prisma.config.ts` define el schema y la carpeta de migraciones.
- `packages/db/src/database-url.ts` normaliza localmente `postgresql+asyncpg://` y escapa credenciales para Prisma/`pg`; no modifica ni imprime `.env`.
- `packages/db/src/client.ts` crea el cliente server-side con `@prisma/adapter-pg` y `pg`.

La URL corregida por el entorno debe apuntar a la base `clonse`. No se ejecutan `reset`, `drop`, `truncate` ni borrados masivos. Antes de aplicar una migración se inspecciona el estado de las tablas existentes y se conserva cualquier estructura no gestionada por este vertical.

## Modelo inicial

`User` y `AuthSession` representan únicamente el contrato de identidad implementado. Los campos se trazan a `se_users` en `migration/inventory/01-acceso-identidad.md`; la tabla destino se llama `users` para no confundirla con la tabla legacy ni sobrescribirla accidentalmente.
