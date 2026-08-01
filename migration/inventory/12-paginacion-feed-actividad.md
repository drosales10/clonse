# Incremento 12 — Paginación del feed de actividad y estados

## Selección

Este incremento continúa la vertical de actividad/estados sin introducir mensajería mientras no exista evidencia de los valores efectivos de `se_levels.level_message_allow` ni del esquema completo de `se_pmconvos`, `se_pmconvoops` y `se_pms`. El destino ya tiene `Activity`, privacidad, amistades, bloqueos, sesión server-side y la superficie autenticada `/home`.

## Evidencia legacy

| Comportamiento | Evidencia | Regla observada |
|---|---|---|
| Feed autenticado | `docs/legacy/user_home.php` | carga `$actions->actions_display($setting['setting_actions_visibility'], $setting['setting_actions_actionsperuser'])` en el inicio del usuario |
| Actividad reciente | `docs/legacy/recent_action.php`, `recent_status.php` | las superficies recientes usan `p`, `make_page()`, orden descendente y metadatos de inicio/fin/total en sus listados |
| Privacidad | `docs/legacy/user_home.php`, `header.php` y clase de acciones | el feed está condicionado por visibilidad de acciones, usuario autenticado y reglas del objeto |
| Destino actual | `src/server/activity/service.ts`, `src/app/home/page.tsx` | muestra estados de usuario/amigos, filtra privacidad y bloqueos server-side y limita el feed actual a 30 elementos |

El valor efectivo de `setting_actions_actionsperuser` no está confirmado sin `se_settings`; por ello este incremento no afirma equivalencia del tamaño global legacy. Implementa paginación estable sobre la lista moderna observable, con tamaño de destino 10 documentado.

## Alcance destino

- Añadir `activityPage` a `/home` con página 1 por defecto.
- Mantener solo estados `editstatus`, usuarios activos, amistades aceptadas, propietario y privacidad visible.
- Mantener exclusión de ambos sentidos de bloqueo.
- Ordenar por `createdAt DESC`.
- Exponer total, página actual, páginas disponibles, inicio y fin.
- Mostrar navegación anterior/siguiente como Server Component.
- No añadir filtros, categorías, acciones de plugins, anuncios, cumpleaños, noticias ni módulos que requieren configuración legacy no confirmada.

## Contrato

`getActivityFeed(viewerId, requestedPage)` devuelve:

```text
{
  items: ActivityFeedItem[],
  pagination: {
    page: number,
    pageSize: 10,
    total: number,
    pageCount: number,
    start: number,
    end: number
  }
}
```

El servidor normaliza páginas no enteras, menores que uno y superiores a la última. El `viewerId` procede de la sesión y no del query string.

## Trazabilidad destino

No se crea migración. Se reutiliza:

- `se_actions` / acciones de estado observadas → `activities`;
- actor → `activities.actor_id` y relación `User`;
- privacidad del objeto → `activities.object_privacy`;
- fecha Unix legacy → `activities.created_at` como `DateTime` destino;
- estado visible moderno → `type = editstatus`.

El índice existente de `Activity` por fecha y actor soporta la lectura base. No se migran datos por ausencia de dump verificable.

## Autorización y privacidad

- Solo usuarios autenticados y habilitados pueden consultar `/home`.
- La actividad propia es visible para el propietario.
- La actividad de amistades aceptadas requiere máscara de privacidad compatible.
- Cualquier bloqueo entre viewer y actor oculta la actividad.
- El cliente no decide actor, privacidad, amistad, bloqueo ni total.

## Casos de paridad

| Caso | Resultado |
|---|---|
| Sin actividad visible | estado vacío y total 0 |
| 11 actividades visibles | página 1 con 10 y página 2 con 1 |
| Página inválida | normalizada a 1 |
| Página fuera de rango | normalizada a la última |
| Actividad privada | no aparece para el viewer no autorizado |
| Bloqueo | no aparece en ninguna página |
| Actividad propia | permanece visible |
| Usuario no autenticado | `/home` redirige a login |

## Diferencias y pendientes

- El tamaño legacy depende de `setting_actions_actionsperuser`, no verificable; el destino fija 10 para hacer observable la paginación y mantener consultas acotadas.
- El legacy incluye acciones de plugins, anuncios, noticias y módulos; este incremento solo cubre estados `editstatus`, ya implementados y verificables.
- No se cierra como equivalencia completa del feed legacy hasta obtener settings, plugins activos y catálogo de tipos de acción.
- Mensajería privada, notificaciones, CAPTCHA, multimedia y moderación permanecen pendientes.

## Criterio de cierre

Se requiere smoke HTTP con actividades sintéticas y relaciones/privacidad/bloqueos, limpieza completa, y validaciones `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, Prisma y `git diff --check`.
