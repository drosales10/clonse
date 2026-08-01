# Incremento 37 — Implementación del catálogo nativo de eventos

## Estado

Implementado el catálogo de lectura de eventos sobre Next.js, React, TypeScript, Prisma y PostgreSQL. La raíz PHP/MySQL, `docs/legacy` y los datos reales permanecen intactos. No se importaron usuarios, eventos, categorías, membresías, uploads ni PII.

## Alcance ejecutado

La implementación cubre:

- categorías activas raíz y descendientes;
- vista `all` y vista `upcoming`;
- orden por creación, inicio o finalización;
- paginación de 10 elementos;
- título, descripción, organizador, host, ubicación, fechas y visitas;
- visibilidad server-side según propietario, usuario registrado o visitante anónimo;
- exclusión conservadora de eventos `inviteOnly` para viewers que no sean propietarios.

No se implementan todavía RSVP, membresías, invitaciones, amistades, subredes, niveles, media, comentarios, campos dinámicos, detalle, creación, edición, borrado ni administración.

## Trazabilidad legacy → destino

| Legacy | Destino | Estado |
|---|---|---|
| `se_eventcats` | `EventCategory` / `event_categories` | Categorías jerárquicas activas, orden y `legacyId` |
| `se_events` | `Event` / `events` | Datos nucleares del catálogo y `legacyId` |
| `event_user_id` | `Event.ownerId` → `User.id` | FK interna; no se resuelve por email/username |
| `event_eventcat_id` | `Event.categoryId` | FK nullable a categoría destino |
| `event_datecreated`/`event_dateupdated` | `createdAt`/`updatedAt` | `DateTime`; conversión Unix queda para el importador |
| `event_date_start`/`event_date_end` | `startsAt`/`endsAt` | `DateTime` nullable; final ausente queda como `NULL` |
| `event_search` | `searchable` | Solo eventos buscables entran al catálogo |
| `event_privacy` | `privacy` | Máscara entera preservada, con bits confirmados solo para owner/registered/anonymous |
| `event_inviteonly` | `inviteOnly` | Booleano moderno; requiere validación de valores en importación |
| `event_views` | `views` | Contador de lectura; no se incrementa en esta consulta |

Los campos dinámicos (`se_eventfields`/`se_eventvalues`), miembros (`se_eventmembers`), álbumes, media, comentarios, estilos y notificaciones quedan fuera del primer catálogo.

## Persistencia

Migración expand-only:

- `packages/db/prisma/migrations/20260802110000_event_catalog/migration.sql`
- `EventCategory` y `Event` añadidos a `packages/db/schema.prisma`.
- Relación `User.eventsOwned` añadida.
- FKs explícitas:
  - propietario: `ON DELETE RESTRICT`;
  - categoría padre: `ON DELETE SET NULL`;
  - categoría del evento: `ON DELETE SET NULL`.
- Índices para owner, jerarquía, categoría, búsqueda y fechas.
- No hay inserts, backfills, drops ni truncates.

La migración se aplicó localmente mediante `pnpm prisma migrate deploy`; el estado confirma que el esquema PostgreSQL está actualizado.

## Contrato y rutas

- Dominio: `packages/domain/src/events.ts`.
- Servicio server-side: `src/server/events/service.ts`.
- API: `GET /api/events`.
- UI: `/events`.

Parámetros aceptados:

```text
page: entero positivo
categoryId: ID interno de categoría opcional
sort: created | startsAt | endsAt
view: all | upcoming
```

`upcoming` exige `startsAt > now` y ordena por inicio ascendente. Una categoría raíz incluye sus descendientes; una subcategoría filtra solo esa categoría. Los filtros se normalizan en servidor y no aceptan nombres de columnas ni SQL.

## Decisión de privacidad

El inventario confirma que la privacidad de eventos también depende de miembros, invitados, amistades, subredes y niveles. Esas entidades no están modeladas todavía en el gemelo, por lo que este incremento no simula relaciones positivas.

La política aplicada es deny-by-default para relaciones no disponibles:

- propietario: permitido;
- viewer registrado: permitido solo si el bit registrado está presente y no es `inviteOnly`;
- visitante anónimo: permitido solo si el bit anónimo está presente y no es `inviteOnly`;
- miembro, invitado, amigo, amigo de miembro, segundo grado, subred o nivel: pendiente de modelos y contexto compartido;
- propietario deshabilitado: excluido.

Esto permite una lectura segura, pero no declara paridad completa con `event_privacy_max()`.

## Validación ejecutada

- `pnpm prisma validate` ✅
- `pnpm prisma generate` ✅
- `pnpm prisma migrate deploy` ✅
- `pnpm prisma migrate status` ✅
- `pnpm exec tsc --noEmit` ✅
- `pnpm exec eslint packages/domain/src/events.ts src/server/events/service.ts src/app/api/events/route.ts src/app/events/page.tsx` ✅
- `pnpm build` ✅; incluye `/events` y `/api/events`.
- `git diff --check` ✅; Windows informa únicamente normalización LF/CRLF.

El lint global continúa fuera del criterio de este incremento por errores preexistentes en JavaScript legacy bajo `docs/Forums/include/forum/fckeditor` y `docs/bussiness/include/js`.

## Pendientes

1. Implementar `UserIdentityMap` antes de importar propietarios legacy.
2. Modelar miembros, invitados, RSVP y estados aprobados de `se_eventmembers`.
3. Resolver amistad, segundo grado, subred, niveles y configuración global de permiso.
4. Inventariar categorías y campos dinámicos efectivos antes de importar valores.
5. Definir sanitización de HTML y adaptador de storage para descripción/media.
6. Crear detalle de evento y casos de uso transaccionales para RSVP, invitaciones, comentarios y media.
7. Decidir y probar si el incremento de visitas pertenece a lectura o a un comando separado.
