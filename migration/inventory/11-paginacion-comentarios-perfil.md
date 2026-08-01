# Incremento 11 — Paginación de comentarios de perfil

## Selección y justificación

Este es el siguiente incremento vertical seleccionado después de visitas y comentarios de perfil. Puede implementarse de extremo a extremo sin añadir tablas ni asumir configuración efectiva: el destino ya tiene `ProfileComment`, privacidad, bloqueos, ownership, Server Actions y smoke HTTP. Los candidatos de notificaciones, CAPTCHA y moderación dependen de catálogos/configuración no verificables; álbumes/fotos y mensajería requieren modelos adicionales, archivos y permisos de nivel todavía no confirmados.

## Evidencia legacy

| Comportamiento | Fuente | Regla observada |
|---|---|---|
| Página y cursor | `docs/legacy/profile.php` | acepta `p` desde GET/POST; la vista `comments` usa esa página para la conversación del perfil |
| Lectura paginada | `docs/legacy/misc_js.php`, tarea `comment_get` | recibe `type`, `iden`, `value`, `p`, `cpp`, `tab` y `col`; crea `se_comment`, calcula `comment_total()`, llama `make_page()` y `comment_list()` |
| Respuesta | `docs/legacy/misc_js.php` | devuelve `total_comments`, `maxpage`, `p_start`, `p_end`, `p` y `comments` |
| Tamaño de página | `docs/legacy/templates/profile_core_comments.tpl` | configura `paginate=true` y `cpp=10` para `type=profile`, `typeIdentifier=user_id`, `typeTab=users`, `typeCol=user` |
| Orden | `docs/legacy/profile_comments.php` | ordena por `profilecomment_date DESC` |
| Privacidad | `docs/legacy/profile.php`, `profile_comments.php` | la lectura se corta si la máscara de perfil del lector no permite ver el perfil; el permiso de comentar es independiente |
| Estados vacíos | `docs/legacy/templates/profile_core_comments.tpl` | muestra la superficie si hay comentarios o permiso para comentar; el total controla la paginación |

No existe dump MySQL verificable. La tabla `se_profilecomments` y sus columnas básicas sí están confirmadas por el código, pero no se pueden afirmar índices ni datos efectivos.

## Alcance destino

- Mantener la lectura server-side del perfil visible y los mismos filtros de bloqueo/cuenta activa.
- Sustituir el límite provisional de 50 comentarios por páginas de 10.
- Exponer únicamente metadatos de paginación y comentarios autorizados.
- Aceptar `p` únicamente como entero positivo y normalizar páginas fuera de rango a la última página disponible.
- Conservar el formulario de creación, edición y borrado como Server Actions; no convertir `p` ni ningún ID en autorización.
- Mantener la página 1 como comportamiento por defecto y preservar la URL `/profile/[username]` con `?commentsPage=N` como parámetro destino explícito.

## Contrato destino

### Lectura

`getPublicProfile(username, viewerId, commentsPage)` resuelve primero propietario, bloqueo y privacidad. Solo después consulta comentarios con `skip=(page-1)*10`, `take=10`, orden `createdAt DESC`, y obtiene el total visible de comentarios del propietario con autores habilitados.

La salida interna incluye:

```text
comments: PublicProfileComment[]
commentsPagination: {
  page: number,
  pageSize: 10,
  total: number,
  pageCount: number,
  start: number,
  end: number
}
```

Para perfiles privados o bloqueados no se filtran datos de paginación: se conserva la respuesta restringida existente.

### Navegación

La UI muestra anterior/siguiente solo cuando `pageCount > 1`, conserva el username escapado y mantiene `commentsPage` en la URL. La navegación es de lectura mediante Server Component; no requiere Client Component.

### Mutaciones

Las acciones existentes siguen recibiendo `ownerUsername` y `commentId`, validan sesión y autorización server-side, y revalidan la ruta del perfil. Tras una mutación se vuelve a la página solicitada solo si el navegador conserva la URL; el servidor no confía en el parámetro para decidir permisos.

## Persistencia y trazabilidad

No se crea migración Prisma. `ProfileComment` ya normaliza `se_profilecomments`:

- `profilecomment_user_id` → `profile_comments.profile_owner_id`;
- `profilecomment_authoruser_id` → `profile_comments.author_id`;
- `profilecomment_body` → `profile_comments.body`;
- `profilecomment_date` → `profile_comments.created_at`.

El índice destino existente `[profileOwnerId, createdAt]` soporta ownership y orden descendente de la página. El total usa `count` sobre el mismo ownership y autores habilitados.

## Actores y autorización

- Anónimo: puede leer la página si el perfil es visible para anónimos; no puede mutar.
- Usuario autenticado: ve solo comentarios de un perfil que puede consultar y respeta bloqueo.
- Autor: edita o borra sus comentarios mediante la acción existente.
- Propietario: borra comentarios de su perfil mediante la acción existente.
- Moderador/administrador: no recibe bypass nuevo porque `moderation_privacy` y niveles efectivos no están verificados.

## Casos de paridad y evidencia requerida

| Caso | Resultado esperado | Estado |
|---|---|---|
| Perfil con 0 comentarios | página 1, total 0, start/end 0, estado vacío | PASS reproducible |
| 11 comentarios | página 1 con 10, página 2 con 1, total 11 | PASS reproducible |
| Página 0, negativa o no numérica | normalizada a página 1 | PASS reproducible |
| Página superior a la última | normalizada a última página | PASS reproducible |
| Perfil privado/bloqueado | no expone comentarios ni metadatos | PASS reproducible |
| Anónimo | puede leer solo si la privacidad lo permite; no publica | PASS reproducible |
| Autor/propietario | mutaciones existentes continúan server-side | PASS heredado del smoke anterior |
| Reordenación | más recientes primero, equivalente a `profilecomment_date DESC` | PASS reproducible |

## Diferencias y pendientes

- `commentsPage` es un parámetro moderno explícito; no se añade compatibilidad con `v=comments` porque la ruta moderna ya muestra la conversación integrada y no existe una URL legacy funcional ejecutada en este destino.
- El legacy usa `make_page()` y permite que su configuración de UI controle `cpp`; el destino fija 10 porque es el valor observable de `profile_core_comments.tpl`. La configuración efectiva no verificable queda pendiente.
- No se añaden notificaciones, CAPTCHA, HTML configurable, respuestas anidadas, comentarios multimedia/blog ni moderación por niveles.
- No se migran datos legacy por ausencia de dump verificable.

## Criterio de cierre

El incremento solo se declara implementado cuando el smoke sintético demuestra páginas, límites, normalización, orden, estado vacío, privacidad/bloqueo y limpieza completa, y cuando `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, validación/generación/migración Prisma y `git diff --check` pasan sin modificar legacy, `.env` ni datos reales.
