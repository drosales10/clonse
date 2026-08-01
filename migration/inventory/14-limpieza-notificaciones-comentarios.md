# Incremento 14 — Limpieza de notificaciones al abrir comentarios

## Selección y evidencia

Este incremento cierra el pendiente explícito del incremento 13. SocialEngine limpia los avisos de comentarios de perfil cuando el propietario abre la vista de comentarios mediante `v=comments`:

| Comportamiento | Evidencia legacy | Destino |
|---|---|---|
| Activar la vista de comentarios | `docs/legacy/profile.php` | `/profile/[username]?v=comments` |
| Limpiar por destinatario | `docs/legacy/profile.php` | `recipientId = sesión` |
| Limpiar solo tipo 3 | `docs/legacy/profile.php` | `type = "profile_comment"`, `legacyTypeId = 3` |
| Limpiar solo el perfil abierto | `docs/legacy/profile.php` | `profileOwnerId/objectId = propietario` |
| Protección de ownership | `docs/legacy/profile.php`, `docs/legacy/misc_js.php` | el servicio moderno exige que sesión y propietario coincidan |

No se implementa una limpieza para terceros, administradores ni avisos de otros tipos. No se afirma equivalencia del catálogo completo de `se_notifys`.

## Contrato

`clearProfileCommentNotifications(userId, ownerUsername)`:

- resuelve el perfil activo por username;
- elimina únicamente avisos `profile_comment` cuyo destinatario y propietario sean la sesión;
- devuelve el número eliminado;
- devuelve `0` si el perfil no existe, está deshabilitado o no pertenece a la sesión.

La operación se dispara solo cuando existe explícitamente `v=comments`. La vista de perfil normal no muta notificaciones.

## UI y flujo

El aviso de `/home` enlaza a `/profile/:username?v=comments`. Al abrirlo, el perfil renderiza la conversación y ejecuta la limpieza server-side. La UI no envía el `userId` ni controla la autorización.

## Casos de paridad

| Caso | Resultado esperado |
|---|---|
| Propietario abre `v=comments` | se eliminan sus avisos de comentarios de ese perfil |
| Propietario abre el perfil sin `v=comments` | los avisos permanecen |
| Tercero abre `v=comments` | no se elimina ningún aviso del propietario |
| Aviso de otro tipo | no se elimina |
| Perfil inexistente/deshabilitado | no se modifica nada |
| Repetir la apertura | operación idempotente, elimina 0 tras la primera limpieza |

## Limitaciones

La ruta moderna muestra comentarios también sin `v=comments`; el parámetro explícito conserva la semántica legacy de lectura/limpieza sin ocultar la conversación existente. El estado leído individual, email y otros tipos de notificación siguen fuera del alcance por falta de esquema/configuración legacy verificable.
