# Incremento 50 — Detalle público de eventos

## Estado

Implementado el detalle de lectura de eventos sobre Next.js, React, TypeScript y Prisma. La raíz PHP/MySQL y `docs/legacy` permanecen intactas; no se importaron usuarios, eventos, membresías, uploads ni datos con PII. No se creó una migración nueva porque el modelo `Event` existente contiene los campos necesarios para esta lectura limitada.

## Evidencia legacy

La página `docs/legacy/event.php` recibe `event_id`, instancia `se_event`, comprueba existencia y calcula `event_privacy_max()` antes de mostrar el evento. El detalle legacy no exige `event_search`; esa bandera se utiliza para el catálogo (`browse_events.php`). Cuando el evento es visible, el legacy carga descripción, fechas, host, ubicación, categoría, vistas, campos dinámicos, miembros, oficiales, RSVP, álbum/media, estilos, comentarios, actividad y acciones condicionadas.

La implementación moderna cubre únicamente los datos que ya están modelados. No afirma paridad completa con `event_privacy_max()` porque todavía no existen en destino miembros, invitaciones, amistades, subredes, niveles ni configuración efectiva de permisos.

## Contrato implementado

| Legacy | Destino | Estado |
|---|---|---|
| `event.php?event_id=...` | `/events/[eventId]` | Detalle server-rendered |
| `event_id` interno | `Event.id` | Resolución exacta |
| `event_id` numérico legacy | `Event.legacyId` | Resolución para enteros positivos |
| `event_title` | `Event.title` | Mostrado como título |
| `event_desc` | `Event.description` | Tags HTML eliminados y entidades básicas normalizadas a texto |
| `event_host` | `Event.host` | Mostrado si existe |
| `event_location` | `Event.location` | Mostrado si existe |
| `event_date_start/end` | `Event.startsAt/endsAt` | `DateTime` mostrado con formato local |
| `event_user_id` | `Event.ownerId` → `User` | Propietario y enlace a perfil |
| `event_eventcat_id` | `Event.categoryId` → `EventCategory` | Categoría mostrada si existe |
| `event_views` | `Event.views` | Lectura del contador, sin incrementarlo |
| `event_privacy` | `Event.privacy` | Evaluado server-side mediante `canReadEvent` |
| `event_inviteonly` | `Event.inviteOnly` | Denegado a no propietarios por política conservadora |
| `event_search` | `Event.searchable` | No se exige en el detalle, conforme a `event.php` |

## Rutas y capas

- Dominio: `packages/domain/src/events.ts` (`PublicEventDetail`, `canReadEvent`).
- Servicio: `src/server/events/service.ts` (`getEventDetail`).
- API: `GET /api/events/[eventId]`.
- UI: `/events/[eventId]`, Server Component con `params` asíncrono de Next 16.
- Navegación: las tarjetas de `/events` enlazan al ID interno del evento.
- Persistencia: se reutiliza `Event`/`EventCategory`; no hay SQL crudo ni nueva migración.

## Visibilidad efectiva

La consulta exige que el propietario esté habilitado y después aplica autorización server-side:

- propietario: permitido;
- usuario registrado: permitido si la máscara contiene el bit registrado y el evento no es `inviteOnly`;
- visitante anónimo: permitido si la máscara contiene el bit anónimo y el evento no es `inviteOnly`;
- `inviteOnly` para no propietarios: denegado;
- propietario deshabilitado, evento inexistente o identificador vacío/no resoluble: `404` / `EVENT_NOT_FOUND`.

La UI no es el control de seguridad. Tanto la página como el Route Handler vuelven a resolver la sesión y llaman al mismo servicio autorizado.

## Diferencias deliberadas y pendientes

No se implementan todavía:

1. Incremento de `event_views`; el detalle es lectura pura para evitar mutaciones ocultas en un GET.
2. Miembros, oficiales, invitaciones, RSVP y solicitudes de membresía (`se_eventmembers`).
3. Reglas completas de amistad, segundo grado, subred, nivel y permisos globales de `event_privacy_max()`.
4. Fotos, álbumes, uploads, comentarios, notificaciones, actividad, estilos y acciones de plugins.
5. Campos dinámicos `se_eventfields`/`se_eventvalues`; no se inventan etiquetas ni valores.
6. Sanitización rica de HTML/BBCode; por ahora el cuerpo se reduce a texto seguro antes de renderizarse.

Estas diferencias quedan abiertas para incrementos verticales posteriores y no se presentan como paridad cerrada.

## Validación ejecutada

- `pnpm exec tsc --noEmit` ✅
- `pnpm exec eslint packages/domain/src/events.ts src/server/events/service.ts src/app/api/events/route.ts src/app/api/events/[eventId]/route.ts src/app/events/page.tsx src/app/events/[eventId]/page.tsx` ✅
- `pnpm build` ✅; incluye `/events/[eventId]` y `/api/events/[eventId]`.
- `git diff --check` ✅; Windows solo informa la normalización habitual LF/CRLF.

No se ejecutaron migraciones, backfills, imports ni operaciones contra datos reales.
