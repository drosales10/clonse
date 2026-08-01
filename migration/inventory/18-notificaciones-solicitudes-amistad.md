# Incremento 18 — Ciclo de notificaciones de solicitudes de amistad

## Selección y evidencia

`docs/legacy/user_friends_manage.php` muestra que una solicitud pendiente ejecuta `notify_add($owner->user_info['user_id'], 'friendrequest', $user->user_info['user_id'])`. El mismo flujo elimina el aviso al confirmar (`add_do` sobre una solicitud existente), rechazar (`reject_do`) o cancelar (`cancel_do`). El email `friendrequest` se mantiene fuera de alcance porque SMTP, plantilla y `usersetting_notify_friendrequest` no están verificables.

| Caso legacy | Entrada destino | Efecto destino | Estado |
|---|---|---|---|
| Nueva solicitud | solicitante autenticado + usuario activo | conexión pending y aviso al destinatario | implementado |
| Aceptar | destinatario autenticado + username del solicitante | conexión accepted y eliminación del aviso | implementado |
| Rechazar | destinatario autenticado + username del solicitante | elimina conexión pending y aviso | implementado |
| Cancelar | solicitante autenticado + username del destinatario | elimina conexión pending y aviso | implementado |

## Contrato destino

El tipo normalizado es `friend_request` y el tipo legacy observado es `1` (`friendrequest`). Para una solicitud `requesterId → addresseeId`:

- `recipientId` y `profileOwnerId` son `addresseeId`;
- `actorId` y `objectId` son `requesterId`;
- el aviso se crea solo con una solicitud realmente creada;
- el aviso se elimina por destinatario, objeto y tipo, dentro de la misma transacción que la mutación de la relación.

La página `/home` muestra únicamente este subconjunto verificable junto con los avisos `profile_comment`. No se presenta como catálogo completo de `se_notifytypes`.

## Autorización y límites

- Todas las mutaciones requieren sesión mediante Server Action y vuelven a validar ownership/dirección en `src/server/profile/service.ts`.
- El servicio solo opera con usuarios activos; no acepta IDs desde el formulario.
- Rechazar, aceptar o cancelar sin una relación pendiente devuelve `not_allowed` y no modifica avisos.
- La consulta de avisos está limitada al `recipientId` de la sesión y filtra actores activos.
- La operación de relación y aviso es atómica con Prisma `$transaction`.

## Trazabilidad

| Destino | Legacy | Evidencia |
|---|---|---|
| `FriendConnection.status=pending/accepted` | `se_friends.friend_status` | `user_friends_manage.php` |
| `Notification.type=friend_request` | `se_notifys.notify_notifytype_id=1`, nombre `friendrequest` | `user_friends_manage.php` |
| `Notification.recipientId` | `notify_user_id` | `notify_add` y `DELETE` legacy |
| `Notification.objectId` | `notify_object_id` del solicitante | `notify_add(..., $user_id)` |

No se añade migración: `Notification` ya dispone de `recipientId`, `actorId`, `profileOwnerId`, `type`, `legacyTypeId` y `objectId`.

## Matriz de paridad y evidencia requerida

| Caso | Resultado esperado | Evidencia |
|---|---|---|
| solicitud válida | destinatario ve un aviso; solicitante no | smoke HTTP |
| aceptar | conexión accepted y aviso eliminado | smoke HTTP |
| rechazar | conexión eliminada y aviso eliminado | smoke HTTP |
| cancelar | conexión eliminada y aviso eliminado | smoke HTTP |
| mutación no autorizada | no elimina ni crea avisos de otra relación | smoke HTTP / autorización server-side |
| anónimo en `/home` | redirect a login | smoke HTTP existente |

## Diferencias y pendientes

- No se migra email `friendrequest`, porque no hay configuración efectiva ni plantilla verificable.
- No se implementa el catálogo completo de notificaciones, plugins ni hooks.
- No se puede afirmar equivalencia de `setting_connection_allow`, `setting_connection_framework`, niveles o subredes sin sus valores efectivos.
- La UI destino expresa el evento como solicitud de conexión y enlaza al perfil del solicitante; no replica plantillas Smarty no disponibles.
