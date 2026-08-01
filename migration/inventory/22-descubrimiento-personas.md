# Bloque 22 — Descubrimiento autenticado de personas

## Alcance y evidencia

Se implementa una superficie autenticada para buscar y descubrir usuarios activos:

- `docs/legacy/search.php`: búsqueda por texto, 20 resultados por página.
- `docs/legacy/user_friends.php`: búsqueda de conexiones por username/nombre y paginación.
- `docs/legacy/popular_people.php`: selección de usuarios visibles y relacionados por conexiones; la variante de popularidad completa queda fuera porque requiere configuración/catálogo real.

Ruta destino: `/people?q=&page=`.

## Contrato

`getPeopleDirectory(viewerId, query)` devuelve:

```text
{
  items: [{ username, displayName, relationship }],
  pagination: { page, pageSize: 20, total, pageCount, start, end, search }
}
```

La búsqueda usa username y display name case-insensitive. No busca por email para no convertir un dato privado en criterio de enumeración. Los resultados se ordenan por display name y username.

## Autorización y privacidad

- `/people` requiere sesión server-side.
- Solo se consideran usuarios activos y verificados distintos del viewer.
- Se excluyen ambos sentidos de bloqueo.
- Se evalúa `profilePrivacy` antes de entregar un resultado.
- Cada resultado incluye la relación actual (`friends`, `incoming_pending`, `outgoing_pending` o `none`) para que la UI muestre la acción correspondiente.
- Las mutaciones siguen usando las Server Actions existentes y vuelven a resolver ownership en el servidor.

## Trazabilidad

| Destino | Legacy | Diferencia |
|---|---|---|
| `User.username/displayName` | campos de `se_users` usados por `search_profile()` | DTO público explícito |
| `User.profilePrivacy` | `user_privacy` | se filtra server-side para usuario autenticado |
| `FriendConnection` | `se_friends` | relación normalizada existente |
| `/people?q=&page=` | `search.php?task=dosearch&search_text=&p=` | ruta moderna autenticada |

## Casos y límites

- búsqueda vacía: devuelve la primera página de usuarios visibles;
- búsqueda sin coincidencias: estado vacío sin filtrar IDs internos;
- página fuera de rango: se normaliza a la última;
- usuario bloqueado: no aparece;
- perfil privado: no aparece;
- conexión pendiente: no se transforma en amistad ni se crea ninguna mutación de lectura;
- recomendaciones/popularidad por votos: fuera de alcance hasta verificar plugins, `se_actiontypes`, settings y tablas asociadas.

No se añade migración Prisma: la superficie utiliza `User`, `FriendConnection` y `ProfileBlock` existentes.
