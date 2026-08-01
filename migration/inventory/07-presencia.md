# Incremento 06 — Presencia básica

## Alcance

Este incremento migra la presencia mínima observable del perfil:

- actualizar la última actividad de una sesión autenticada válida;
- calcular `online` con una ventana de actividad reciente;
- mostrar online/offline en el perfil público después de autorización y privacidad;
- mantener el estado offline cuando la cuenta no ha tenido actividad reciente.

No se crea una tabla de visitantes ni se registra IP, navegador, cookie de presencia, invisibilidad o actividad histórica.

## Evidencia legacy

| Comportamiento | Fuente | Observación |
|---|---|---|
| Actualización de actividad autenticada | `docs/legacy/include/class_user.php::user_checkCookies()` | actualiza `se_users.user_lastactive` con límite aproximado de 600 segundos |
| Visitantes y sesión | `class_user.php::user_checkCookies()` | escribe `se_visitors` con IP, navegador, usuario e invisibilidad |
| Lista online | `docs/legacy/include/functions_general.php::online_users()` | filtra actividad de aproximadamente 10 minutos y visitantes invisibles |
| Perfil | `docs/legacy/profile.php` | asigna `is_online` al perfil después de privacidad |
| Modelo destino existente | `packages/db/schema.prisma` | `User.lastActiveAt` ya está disponible como `last_active_at` |

## Actores y privacidad

- **Usuario autenticado:** su actividad se actualiza solo cuando la sesión HTTP-only es válida, el usuario está habilitado y verificado.
- **Visitante:** no escribe actividad ni obtiene datos de actividad privada.
- **Perfil visible:** puede mostrar únicamente el estado booleano `online` junto a los datos ya autorizados del perfil.
- **Perfil privado o bloqueado:** no consulta ni expone presencia.
- **Administración:** fuera del alcance.

La presencia no concede acceso a perfiles ni modifica `canViewProfile`; se calcula después de superar las comprobaciones de bloqueo y privacidad.

## Contrato destino

Dominio:

```text
type PresenceStatus = "online" | "offline"
```

El DTO público contiene solo:

```text
presence: {
  status: "online" | "offline"
}
```

No se devuelve `lastActiveAt`, fecha exacta, IP, user-agent, historial, ubicación ni identificadores de sesión.

Una cuenta está online si `lastActiveAt` está dentro de los últimos 10 minutos respecto al reloj del servidor. La comparación se realiza en server-side; el navegador no decide el estado.

La sesión actual actualiza `lastActiveAt` como máximo una vez cada dos minutos para evitar escrituras en cada lectura. El login también deja actividad reciente mediante el flujo de autenticación existente.

## Diferencias y pendientes

- Se usa `users.last_active_at` en lugar de `se_visitors`; no se dispone del índice/esquema MySQL efectivo.
- No se migra `visitor_invisible` ni `user_invisible` porque no existe un campo equivalente confirmado.
- No se mantiene la lista global de online users ni un contador de visitantes.
- La ventana de 10 minutos reproduce la regla observada, pero no se presenta como configuración efectiva verificada.
- No se muestra la hora exacta de última actividad para reducir exposición de comportamiento.
- No se generan acciones, notificaciones ni eventos de presencia.
- No se modifica `docs/legacy`, PHP/MySQL, `.env` ni datos reales.

## Criterios de aceptación

1. Una sesión válida actualiza la actividad como máximo una vez por ventana de throttling.
2. Una sesión ausente, expirada, inválida, no verificada o deshabilitada no actualiza actividad.
3. `lastActiveAt` reciente produce `online`.
4. `lastActiveAt` ausente o antiguo produce `offline`.
5. Un perfil privado o bloqueado no expone presencia.
6. Un perfil público expone solo `online`/`offline`, nunca la fecha exacta.
7. El cálculo usa el reloj del servidor y no datos enviados por el navegador.
8. Los smoke tests pueden modificar y restaurar usuarios sintéticos sin afectar datos reales.
