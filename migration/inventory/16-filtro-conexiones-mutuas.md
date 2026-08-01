# Incremento 16 — Filtro de conexiones mutuas

## Selección y evidencia

`docs/legacy/profile_friends.php` recibe `m`; cuando `m=1` y existe sesión, añade una condición que conserva solo conexiones del propietario cuyo usuario también está conectado con la sesión. El controlador calcula además el total de conexiones mutuas. Este incremento migra solo el filtro de lectura, sobre la paginación y búsqueda del incremento 15.

| Comportamiento | Legacy | Destino |
|---|---|---|
| Activar filtro | `GET/POST m=1` | `GET /profile/:username?...&m=1` |
| Relación requerida | `se_friends` confirmadas | `FriendConnection.status = "accepted"` |
| Actor del filtro | `$user->user_info[user_id]` | `viewerId` de la sesión server-side |
| Perfil consultado | `$owner->user_friend_list` | `getPublicProfileFriends` después de `canViewProfile` |
| Límite/página/búsqueda | `p`, `search`, 10 | `friendsPage`, `friendsSearch`, 10 |

No se crean tablas ni migraciones. No se consultan IDs enviados por el navegador.

## Contrato

`getPublicProfileFriends(userId, viewerId, requestedPage, search, mutualOnly)` devuelve los mismos items y paginación del incremento 15, añadiendo `pagination.mutualOnly`.

- Si `mutualOnly=false`, devuelve todas las conexiones confirmadas visibles.
- Si `mutualOnly=true` y hay sesión, conserva las conexiones del propietario que también pertenecen al conjunto de conexiones confirmadas del viewer.
- Si no hay sesión, la página no activa el filtro; la UI no ofrece la casilla al anónimo porque `m=1` se ignora server-side.
- La búsqueda y paginación se aplican después del filtro mutual.

## Autorización y privacidad

La ruta resuelve bloqueos, relación y privacidad antes de cargar la lista. El actor del filtro procede de `getCurrentUser`; un tercero no puede elegir otro `viewerId`. Solo se devuelven username y display name públicos.

## UI

La sección pública conserva búsqueda, paginación y estados vacíos. Para usuarios autenticados añade “Solo conexiones mutuas”. Los enlaces de paginación preservan `friendsSearch` y `m=1`.

## Casos de paridad

| Caso | Resultado |
|---|---|
| Sesión con conexiones mutuas | solo aparecen conexiones compartidas |
| Sesión sin conexión con alguien | esa conexión se excluye |
| `m=1` con búsqueda | se aplican ambos filtros |
| `m=1` con paginación | total y páginas corresponden al subconjunto mutual |
| Anónimo | no recibe datos adicionales ni activa el filtro |
| Perfil privado/bloqueado | no se consulta la lista |
| Repetir petición | lectura idempotente, sin mutaciones |

## Diferencias y pendientes

El legacy puede representar conexiones en ambas direcciones según `setting_connection_framework`; el destino usa la relación aceptada canónica existente y trata ambos sentidos como equivalentes. No se migran niveles, subredes, tipos de conexión, explicaciones ni notificaciones de amistad porque su configuración efectiva no está verificada.
