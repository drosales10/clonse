# Incremento 21 — Actividad social al confirmar conexiones

## Selección y evidencia

`docs/legacy/user_friends_manage.php` ejecuta `actions_add(..., "addfriend", ...)` cuando se confirma una solicitud existente y cuando se crea una conexión inmediata (`friend_status=1`). La acción se registra con el usuario que realiza la conexión, su privacidad y el usuario relacionado. La notificación `friendrequest` se elimina al confirmar.

El destino ya dispone de `FriendConnection`, `Activity` y `Notification`; se amplía el tipo de actividad sin crear tablas.

## Contrato destino

- Tipo normalizado: `addfriend`.
- Actor: usuario que confirma la solicitud.
- Texto visible: `Se ha conectado con <displayName>`.
- `objectPrivacy`: máscara `profilePrivacy` actual del actor.
- La confirmación de la relación, la actividad `addfriend` y la eliminación de la notificación se ejecutan en una única transacción.
- Las conexiones pendientes no publican `addfriend`; la actividad aparece al pasar a `accepted`, como en el legacy.
- El feed muestra `addfriend` junto con `editstatus`, sujeto a las mismas reglas de usuario activo, conexión aceptada, privacidad y bloqueo.

## Autorización y privacidad

- Solo el destinatario de una solicitud puede ejecutar la transición de aceptación mediante el servicio server-side.
- El actor se obtiene de la sesión; el username recibido solo localiza al solicitante activo.
- Un tercero, una cuenta deshabilitada o una relación inexistente no crea actividad.
- El feed no muestra actividades de bloqueados ni a lectores que no superen `objectPrivacy`.
- No se expone email, ID interno, serialización PHP ni parámetros confiados al cliente.

## Trazabilidad

| Destino | Legacy | Observación |
|---|---|---|
| `activities.type=addfriend` | `se_actions` + tipo `addfriend` | tipo estable normalizado |
| `activities.actor_id` | usuario pasado a `actions_add` | actor que confirma/crea |
| `activities.object_privacy` | `user_privacy` del actor | máscara vigente |
| `activities.text` | argumentos serializados de `actions_add` | texto seguro destino, no serialización PHP |
| `friend_connections.status=accepted` | `se_friends.friend_status=1` | transición previa a la actividad |
| `notifications` cleanup | `se_notifys` tipo `friendrequest` | misma transacción destino |

## Matriz de paridad

| Caso | Resultado esperado | Evidencia |
|---|---|---|
| Solicitud pendiente | no aparece `addfriend` | servicio y smoke de conexiones |
| Aceptación | relación accepted, actividad y aviso eliminado atómicamente | servicio/build; fixture sintético |
| Conexión inmediata | actividad del actor con privacidad propia | contrato; configuración legacy no verificada |
| Feed de conexión | `addfriend` visible si privacidad y bloqueo lo permiten | `activity-http-smoke.mjs` |
| Feed anónimo | no accede al home autenticado | smoke HTTP |
| Actor bloqueado | actividad excluida | smoke de actividad |
| Aceptación inválida | no hay relación ni actividad nueva | autorización server-side |

## Diferencias y límites

- El destino no reproduce la serialización PHP ni todas las variantes de framework bidireccional; la configuración efectiva no está disponible.
- Solo se implementa el evento `addfriend`; el catálogo completo de acciones legacy, preferencias y plugins queda fuera de alcance.
- El texto se presenta como frase segura en React y no como plantilla Smarty configurable.
- No se implementa email ni notificación adicional al aceptar.
