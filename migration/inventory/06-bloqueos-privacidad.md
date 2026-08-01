# Incremento 05 — Bloqueos y privacidad relacional

## Alcance

Este incremento migra el bloqueo dirigido entre usuarios:

- bloquear a otro usuario activo;
- desbloquear a un usuario bloqueado por la cuenta actual;
- listar bloqueos propios en `/account/blocks`;
- mostrar acciones de bloqueo/desbloqueo desde `/profile/[username]`;
- eliminar atómicamente las conexiones y solicitudes entre las dos cuentas al bloquear;
- impedir que una cuenta bloqueada vea o gestione la relación del bloqueador.

No se migran todavía permisos configurables por nivel, notificaciones, correo, auditoría, reportes, moderación administrativa ni importación del campo legacy `user_blocklist` porque no existe dump MySQL verificable.

## Evidencia legacy

| Comportamiento | Fuente | Observación |
|---|---|---|
| Entrada y salida del flujo | `docs/legacy/user_friends_block.php` | tareas `block_do` y `unblock_do` |
| Permiso | `user_friends_block.php` | requiere `level_profile_block`; nivel destino no existe aún |
| Ownership | `user_friends_block.php` | el usuario de sesión modifica su propio blocklist |
| Auto-bloqueo | `user_friends_block.php` | se rechaza si actor y propietario coinciden |
| Persistencia | `user_friends_block.php`, `class_user.php` | lista CSV `se_users.user_blocklist` |
| Efecto sobre amistades | `user_friends_block.php` | bloquear llama a `user_friend_remove()` |
| Efecto sobre solicitudes | `user_friends_manage.php` | una cuenta bloqueada no puede completar la relación |
| Lectura de bloqueo | `class_user.php::user_blocked()` | el actor consulta si el objetivo está en su propia lista |

## Modelo destino

Se añade `ProfileBlock` como relación dirigida:

- `blockerId`: cuenta que bloquea;
- `blockedId`: cuenta bloqueada;
- `createdAt`: fecha de creación;
- unique `(blockerId, blockedId)` para idempotencia.

Se normaliza el CSV legacy para evitar parsing ambiguo, búsquedas parciales y escrituras concurrentes sobre una lista compartida. Una migración de datos desde `user_blocklist` queda pendiente hasta disponer del esquema y datos MySQL reales.

## Actores y autorización

- **Visitante:** no puede bloquear ni desbloquear.
- **Usuario autenticado:** solo puede crear/eliminar relaciones cuyo `blockerId` sea su ID de sesión.
- **Usuario bloqueado:** no puede desbloquearse ni alterar la relación del bloqueador.
- **Administración:** fuera de alcance; no se reutilizan las acciones de usuario como capacidad administrativa.

El legacy condiciona la capacidad a `level_profile_block`. Como no hay `UserLevel` ni configuración efectiva en PostgreSQL, esta fase permite la acción a cualquier usuario autenticado activo y conserva la diferencia como pendiente explícita, no como paridad cerrada.

## Estados y transiciones

| Estado | Actor | Operación | Resultado |
|---|---|---|---|
| no bloqueado | usuario autenticado distinto del objetivo | bloquear | crea relación y elimina conexiones/solicitudes entre ambos |
| bloqueado por actor | mismo actor | desbloquear | elimina únicamente su relación dirigida |
| bloqueado por objetivo | usuario afectado | cualquier acción social | no permitido; perfil restringido |
| actor = objetivo | cualquier usuario | bloquear/desbloquear | rechazo |

Bloquear es idempotente: una relación existente no se duplica y la operación puede volver a ejecutarse sin generar efectos adicionales. Desbloquear una relación inexistente devuelve un error genérico de estado no disponible.

La eliminación de `FriendConnection` se ejecuta en la misma transacción que la creación del bloqueo. No se borran otras relaciones ni datos de perfil.

## Privacidad del perfil

Antes de cargar campos dinámicos, conexiones o cualquier DTO público, `getPublicProfile` comprueba la relación de bloqueo:

- si el visitante está bloqueado por el propietario, devuelve la superficie privada sin datos del propietario;
- si el visitante bloqueó al propietario, devuelve una superficie mínima `blocked` con el username de ruta y solo la acción de desbloqueo;
- si no hay bloqueo, se mantiene la comprobación normal de `profilePrivacy` y las reglas de amistad.

La respuesta de bloqueo no contiene email, nombre, campos dinámicos, conexiones ni actividad. El usuario que bloqueó conserva la capacidad de desbloquear desde esa superficie mínima; el usuario bloqueado no recibe una ruta de evasión.

## Server Actions y rutas

Acciones separadas, sin parámetro genérico `task`:

- `blockUserAction`;
- `unblockUserAction`.

Ambas reciben un `username` no confiable, validan su formato, resuelven el usuario activo en PostgreSQL y obtienen el actor desde la sesión HTTP-only. La lista `/account/blocks` solo consulta bloqueos donde `blockerId` coincide con la sesión.

## Diferencias y pendientes de paridad

- Se sustituye el CSV legacy por una tabla normalizada; no se importan valores sin dump verificable.
- El permiso `level_profile_block` aún no está modelado y se permite a cualquier usuario autenticado activo.
- La frontera `blocked`/`private` es una decisión de seguridad moderna; el controlador legacy observado mezcla la pantalla de bloqueo con el perfil y no aporta una política completa de lectura.
- No se generan notificaciones, emails, acciones sociales ni auditoría.
- No existe moderación administrativa ni desbloqueo administrativo.
- No se modifican `docs/legacy`, PHP/MySQL, `.env` ni datos reales.

## Criterios de aceptación

1. Un visitante no puede acceder a `/account/blocks` ni ejecutar bloqueo/desbloqueo.
2. Un usuario autenticado puede bloquear otro usuario activo distinto de sí mismo.
3. El bloqueo elimina conexiones y solicitudes en ambas direcciones.
4. El bloqueo no se duplica y el desbloqueo solo afecta al actor propietario.
5. Un usuario bloqueado no puede ver el perfil ni ejecutar acciones de amistad del bloqueador.
6. El bloqueador puede llegar a una vista mínima y desbloquear.
7. La lista de bloqueos no incluye usuarios bloqueados por otra cuenta.
8. No se exponen emails, tokens, hashes, IDs internos ni SQL en DTOs públicos.
9. Las acciones son server-side, validan sesión, objetivo y ownership.
10. El smoke sintético limpia bloqueos, conexiones, solicitudes, usuarios y sesiones.
