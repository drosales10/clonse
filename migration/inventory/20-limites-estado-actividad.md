# Incremento 20 — Límites de estado y actividad

## Selección y evidencia

Este incremento cierra dos bordes observables del flujo `editstatus` ya migrado:

- `docs/legacy/misc_js.php`, tarea `status_change`: el estado vacío actualiza el usuario pero no llama a `actions_add()`.
- `docs/legacy/include/class_actions.php::actions_add()`: la ventana de coalescencia es de 600 segundos para el mismo usuario y tipo.

El modelo destino ya contiene `users.status`, `users.status_updated_at` y `activities`; no se añade esquema.

## Contrato destino

Para el usuario autenticado y verificado:

| Entrada | Resultado en `User` | Resultado en `Activity` |
|---|---|---|
| estado no vacío sin actividad reciente | guarda estado y fecha; crea `editstatus` | una fila nueva |
| estado no vacío dentro de 600 s | guarda estado y fecha | actualiza texto, privacidad y fecha de la actividad reciente |
| estado no vacío después de 600 s | guarda estado y fecha | crea otra actividad |
| estado vacío | guarda `status=null` y fecha | no crea ni borra actividades previas |

El servidor obtiene el actor desde la sesión y mantiene la actualización de usuario y actividad en una transacción. La validación limita el estado a 100 caracteres Unicode y conserva la máscara de privacidad seleccionada al publicar.

## Autorización y privacidad

- Visitantes y sesiones ausentes no pueden mutar el estado.
- Usuarios deshabilitados o no verificados no pueden ejecutar la mutación.
- La actividad propia es visible para el autor; la de conexiones aceptadas pasa por privacidad y bloqueo server-side.
- El estado vacío no elimina el historial de actividad, evitando pérdida de trazabilidad.
- No se acepta `userId`, `username` ni `actorId` desde el formulario como autoridad.

## Trazabilidad

| Destino | Legacy | Nota |
|---|---|---|
| `users.status` | `se_users.user_status` | estado actual |
| `users.status_updated_at` | `se_users.user_status_date` | fecha normalizada a `DateTime` |
| `activities.type=editstatus` | `se_actions`/`se_actiontypes` | actividad normalizada sin serialización PHP |
| `activities.created_at` | fecha de acción | se actualiza al coalescer |
| `activities.object_privacy` | `user_privacy` pasado a `actions_add()` | máscara vigente al publicar |

## Matriz de paridad

| Caso | Resultado esperado | Evidencia |
|---|---|---|
| Primer estado | una actividad visible | `activity-http-smoke.mjs` |
| Segundo estado antes de 600 s | una actividad con texto nuevo | smoke existente |
| Estado después de 600 s | dos actividades | smoke ampliado |
| Limpiar estado | estado nulo, historial intacto | smoke ampliado |
| Estado >100 caracteres | error sin mutación ni actividad | smoke existente |
| Privacidad/bloqueo | actividades no autorizadas ausentes | smoke existente |
| Anónimo | `/home` redirige y no muta | smoke existente |

## Diferencias y pendientes

- Se mantiene el feed acotado a usuario propio y conexiones aceptadas; settings globales, subredes y preferencias de tipos legacy no están verificadas.
- `activities` normaliza `se_actions` sin migrar serialización PHP ni catálogo completo `se_actiontypes`.
- No se implementan comentarios, medios ni notificaciones adicionales de actividad.
