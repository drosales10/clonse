# Incremento 17 — Paginación de conexiones y solicitudes autenticadas

## Selección y evidencia

SocialEngine pagina por separado las conexiones confirmadas y las solicitudes en la superficie autenticada:

| Superficie | Evidencia | Parámetros legacy | Destino |
|---|---|---|---|
| Conexiones confirmadas | `docs/legacy/user_friends.php` | `p`, `search`, `s`, límite 10 | `/account/friends?friendsPage=&friendsSearch=` |
| Solicitudes entrantes | `docs/legacy/user_friends_requests.php` | `p`, estado entrante pendiente, límite 10 | `/account/friends?incomingPage=` |
| Solicitudes salientes | `docs/legacy/user_friends_requests_outgoing.php` | `p`, estado saliente pendiente, límite 10 | `/account/friends?outgoingPage=` |

La configuración efectiva de `setting_connection_allow`, tipos de conexión, orden por fecha/login/tipo y niveles no está verificada. Se migra el comportamiento observable de límite, búsqueda pública segura y navegación, sin afirmar equivalencia de esos settings.

## Contrato destino

`getFriendDashboard(userId, query)` devuelve tres listas paginadas y metadatos independientes:

```text
{
  friends, friendsPagination,
  incomingRequests, incomingPagination,
  outgoingRequests, outgoingPagination
}
```

Cada paginación contiene `page`, `pageSize=10`, `total`, `pageCount`, `start`, `end` y `search`. Las páginas fuera de rango se normalizan a la última. La búsqueda de conexiones confirmadas usa username/display name case-insensitive y no email para no exponer un criterio privado.

## Autorización

- `/account/friends` continúa exigiendo sesión.
- `userId` procede de `getCurrentUser`, nunca de query params.
- Solo se incluyen usuarios activos y relaciones con la dirección/estado correspondiente.
- Las acciones existentes siguen siendo server-side y reciben usernames no confiables.
- No se cambia la autorización de aceptar, rechazar, cancelar o eliminar conexiones.

## UI

Cada sección del dashboard muestra su propio contador total, estado vacío y navegación accesible. Conexiones confirmadas incorpora búsqueda. Los enlaces conservan únicamente los parámetros de la sección y `friendsSearch` cuando corresponde.

## Casos de paridad

| Caso | Resultado |
|---|---|
| 11 conexiones confirmadas | primera página 10, segunda página 1 |
| 11 solicitudes entrantes | primera página 10, segunda página 1 |
| 11 solicitudes salientes | primera página 10, segunda página 1 |
| búsqueda de conexión | filtra solo confirmadas sin email |
| página fuera de rango | se muestra la última página |
| anónimo | redirige a login |
| usuario deshabilitado relacionado | no aparece en la lista |
| mutaciones existentes | conservan ownership y estado server-side |

## Diferencias y pendientes

- `s=ud/ld/t` del legacy no se reproduce porque el destino no tiene un contrato confirmado de fecha de actualización, último login ni `friend_type` visible.
- La búsqueda legacy por email se omite por privacidad.
- `setting_connection_allow`, framework, subredes, niveles, tipos, explicaciones, notificaciones y email siguen fuera de alcance.
- El incremento no crea tablas ni migraciones Prisma.
