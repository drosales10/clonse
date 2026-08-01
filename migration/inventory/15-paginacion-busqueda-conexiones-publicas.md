# Incremento 15 — Paginación y búsqueda de conexiones públicas

## Selección y evidencia

SocialEngine separa la lista pública de conexiones en `profile_friends.php`. El controlador recibe `search`, `m` y `p`, calcula el total, limita a 10 elementos y usa `user_friend_list`; la búsqueda cubre username y nombre visible y el filtro `m=1` restringe a conexiones mutuas. La configuración efectiva de detalles y mutualidad no está disponible, por lo que este incremento conserva solo búsqueda básica de username/display name y paginación.

| Comportamiento | Legacy | Destino |
|---|---|---|
| Lista de conexiones confirmadas | `docs/legacy/profile_friends.php`, `docs/legacy/include/class_user.php` | `getPublicProfileFriends` |
| Tamaño de página | `profile_friends.php`: `$friends_per_page = 10` | `PUBLIC_PROFILE_FRIENDS_PAGE_SIZE = 10` |
| Página solicitada | `profile_friends.php`: `p` y `make_page` | `friendsPage` |
| Búsqueda | `profile_friends.php`: `search` sobre username/nombre/email | `friendsSearch` sobre username/display name; email no se expone |
| Privacidad | `profile.php`/`profile_friends.php` y clase de usuario | se resuelve `canViewProfile` antes de cargar conexiones |
| Estados listados | `friend_status=1` | `FriendConnection.status = "accepted"` |

No se modifica `docs/legacy`, no se migran datos y no se añade una tabla nueva.

## Contrato destino

`getPublicProfileFriends(userId, requestedPage, search)` devuelve:

```text
{
  items: [{ username, displayName }],
  pagination: {
    page, pageSize: 10, total, pageCount,
    start, end, search
  }
}
```

La página pública recibe `friendsPage` y `friendsSearch`. La búsqueda se recorta a 64 caracteres y se ejecuta con coincidencia case-insensitive. Una página fuera de rango se normaliza a la última página.

## Autorización y privacidad

- Anónimo: solo ve conexiones si el perfil supera su privacidad.
- Usuario autenticado: ve únicamente conexiones confirmadas del propietario visible.
- Bloqueado o perfil privado: no se consulta ni se renderiza la lista.
- La UI no recibe emails, IDs internos ni estado privado.
- La búsqueda nunca cambia el ownership: el `userId` procede del perfil resuelto, no del navegador.

## UI

La sección pública de conexiones incluye un formulario GET “Buscar conexiones”, estados vacíos, contador de resultados y navegación accesible “Conexiones anteriores/siguientes”. El propietario mantiene el enlace a `/account/friends`.

## Diferencias y pendientes

- El legacy puede buscar también por email; el destino lo omite para no convertir un dato privado en criterio público.
- El filtro de conexiones mutuas `m=1` no se expone todavía porque requiere definir su capacidad y contrato UI.
- La implementación carga las conexiones confirmadas visibles, ordena el DTO por nombre y pagina el resultado; no se declara aún una optimización SQL equivalente a la paginación legacy.
- No se implementan niveles, subredes, tipos de conexión, explicaciones ni notificaciones de amistad.

## Criterios de aceptación

1. Un perfil visible muestra 10 conexiones como máximo.
2. `friendsPage=2` muestra la página siguiente sin repetir la primera.
3. Una página fuera de rango se normaliza a la última.
4. `friendsSearch` filtra username y display name sin filtrar datos privados.
5. Un perfil privado/bloqueado no consulta ni expone conexiones.
6. El estado vacío y la navegación son accesibles.
7. El smoke usa usuarios sintéticos y limpia todas sus relaciones.
