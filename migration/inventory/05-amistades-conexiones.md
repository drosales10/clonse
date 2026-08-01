# Incremento 04 — Amistades y conexiones básicas

## Alcance

Este incremento migra la primera parte de la red social relacional:

- consultar conexiones confirmadas;
- consultar solicitudes entrantes y salientes;
- enviar una solicitud;
- aceptar o rechazar una solicitud entrante;
- cancelar una solicitud saliente;
- eliminar una conexión confirmada;
- mostrar en el perfil público una lista acotada de conexiones y el estado de la relación con el visitante.

Rutas destino:

- `/account/friends`: superficie autenticada de conexiones y solicitudes;
- `/profile/[username]`: lista pública acotada y acciones de relación cuando existe sesión.

No se incluyen todavía bloqueos, amigo-de-amigo, subredes, niveles configurables, tipos de conexión, explicaciones, notificaciones, email, acciones del feed, búsqueda por email ni paginación pública. No existe dump MySQL ni configuración efectiva verificable para reproducir esas partes con seguridad.

## Evidencia legacy

| Comportamiento | Fuente | Observación |
|---|---|---|
| Lista propia de amistades confirmadas | `docs/legacy/user_friends.php` | `user_friend_total(0, 1)` y `user_friend_list(..., friend_status=1)` |
| Solicitudes entrantes | `docs/legacy/user_friends_requests.php` | dirección entrante, estado `0`, página autenticada |
| Solicitudes salientes | `docs/legacy/user_friends_requests_outgoing.php` | dirección saliente, estado `0`, página autenticada |
| Lista en perfil | `docs/legacy/profile_friends.php` | conexiones confirmadas del propietario, con filtro mutuo en legacy |
| Transiciones | `docs/legacy/user_friends_manage.php` | `add_do`, `reject_do`, `cancel_do`, `remove_do` |
| Persistencia | `docs/legacy/include/class_user.php` | `se_friends(friend_user_id1, friend_user_id2, friend_status, friend_type)` |
| Explicación opcional | `class_user.php` y `se_friendexplains` | fuera de este incremento |
| Restricciones | `user_friends_manage.php` y `class_user.php` | bloqueo, framework, subred y amigo-de-amigo dependen de settings/tablas no confirmados |

## Actores y autorización

- **Visitante:** no puede leer `/account/friends`; el perfil público solo muestra conexiones si el perfil supera `canViewProfile`.
- **Usuario autenticado:** solo gestiona relaciones en las que es solicitante, destinatario o participante confirmado. El actor siempre procede de `getCurrentUser()`.
- **Propietario del perfil:** la lectura pública de conexiones se realiza únicamente después de la comprobación de privacidad global del perfil.
- **Administración/moderación:** fuera del alcance; no se reutilizan estas acciones como capacidad administrativa.

La instalación legacy puede restringir invitaciones mediante `setting_connection_allow`, `setting_connection_framework`, subredes, niveles y bloqueo. Como no existe su configuración efectiva en el destino, esta fase permite solicitar a cualquier usuario activo distinto del actor y deja la diferencia como pendiente explícita. No se presenta como paridad completa.

## Contrato de datos destino

Se añade `FriendConnection` como relación dirigida y normalizada:

- `requesterId`: usuario que inicia la solicitud;
- `addresseeId`: usuario que la recibe;
- `status`: `pending` o `accepted`, validado en dominio;
- `createdAt`, `updatedAt`.

La clave única `(requesterId, addresseeId)` evita duplicados en una dirección. En esta fase una conexión aceptada se representa por una sola fila canónica, aunque el legacy puede crear filas en ambas direcciones según `setting_connection_framework`. No se inventa una segunda fila para compensar una configuración no observada.

Los valores legacy `friend_type` y `friendexplain_body` no se copian todavía porque sus opciones son configurables y no tienen contrato moderno confirmado. La eliminación de una conexión elimina la fila dirigida; las solicitudes rechazadas o canceladas no dejan historial, igual que el borrado observado en legacy.

## Estados y transiciones

| Estado actual | Actor | Operación | Estado/efecto destino |
|---|---|---|---|
| `none` | solicitante autenticado | enviar | crea `pending` |
| `incoming_pending` | destinatario | aceptar | cambia a `accepted` |
| `incoming_pending` | destinatario | rechazar | elimina la solicitud |
| `outgoing_pending` | solicitante | cancelar | elimina la solicitud |
| `accepted` | cualquiera de los dos | eliminar | elimina la conexión |
| `self` | propietario | cualquier operación | rechazada |

Una solicitud existente en cualquier dirección no se duplica. Las acciones vuelven a comprobar usuarios activos, dirección y estado en el servidor; no confían en botones ocultos ni en el estado enviado por el navegador.

## DTOs y privacidad

Los DTOs públicos contienen solo `username`, `displayName` y estado de relación. Nunca contienen email, hash, tokens, sesiones ni IDs internos salvo que una acción server-side los resuelva directamente desde el username validado.

`getPublicProfile` carga conexiones solo después de `canViewProfile(ownerId, profilePrivacy, viewerId)`. Las conexiones listadas son confirmadas y pertenecen al propietario. El visitante anónimo no recibe acciones de escritura. La relación del visitante con el propietario se muestra solo como estado de UI y no concede acceso adicional a campos privados.

La lista se limita inicialmente a una consulta pequeña y ordenada por nombre; la paginación y búsqueda quedan pendientes para no trasladar la búsqueda legacy por email sin un contrato de privacidad confirmado.

## API/Server Actions

No se introduce un endpoint genérico `task`. Se implementan acciones server-side separadas:

- `sendFriendRequestAction`;
- `acceptFriendRequestAction`;
- `rejectFriendRequestAction`;
- `cancelFriendRequestAction`;
- `removeFriendAction`.

Cada acción recibe un `username` de destino como entrada no confiable, valida su forma, resuelve el usuario activo en PostgreSQL y usa el ID de sesión como actor. Los cambios de estado usan transacciones o actualizaciones condicionadas y devuelven mensajes genéricos para no filtrar la estructura interna.

## Diferencias y pendientes de paridad

- `setting_connection_allow` no está modelado todavía; se permite la solicitud entre usuarios activos.
- No se aplican bloqueo, amigo-de-amigo, subred ni permisos por nivel porque no hay tablas/configuración destino verificables.
- No se generan `friendrequest` en notificaciones, emails ni acciones `addfriend`.
- No se trasladan `friend_type` ni `se_friendexplains`.
- Se usa una única relación aceptada canónica en vez del posible par de filas legacy.
- La lista pública no incluye búsqueda por email ni paginación todavía.
- No se modifica ningún archivo bajo `docs/legacy` ni se versionan datos reales.

## Criterios de aceptación

1. Un visitante no puede leer `/account/friends`.
2. Un usuario autenticado puede enviar una solicitud a otro usuario activo.
3. Solo el destinatario puede aceptar o rechazar una solicitud entrante.
4. Solo el solicitante puede cancelar una solicitud saliente.
5. Cualquiera de los dos participantes puede eliminar una conexión aceptada.
6. No se crean duplicados ni se permite una relación consigo mismo.
7. Un perfil público visible muestra solo conexiones confirmadas y datos públicos básicos.
8. Un perfil no visible no consulta ni expone su lista de conexiones.
9. Otro usuario no puede mutar una relación ajena alterando el username enviado.
10. Todas las transiciones se pueden limpiar en un smoke sintético sin afectar usuarios reales.
