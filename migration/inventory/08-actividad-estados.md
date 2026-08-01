# Actividad mínima y estados

## Alcance del incremento

Este incremento cierra el flujo observable de estado breve y una primera lectura autenticada de actividad `editstatus`:

- el usuario autenticado puede guardar o limpiar su estado breve;
- un estado no vacío publica una actividad de tipo `editstatus`;
- actualizaciones del mismo usuario y tipo dentro de 600 segundos coalescen sobre la actividad anterior, según `se_actions::actions_add()`;
- `/home` muestra la actividad propia y la de conexiones aceptadas que el usuario puede ver;
- los bloqueos y la privacidad se aplican server-side antes de devolver el feed.

No se incluyen todavía comentarios, medios, notificaciones, preferencias configurables de tipos, subredes, plugins, anuncios ni el catálogo completo de `se_actiontypes`.

## Evidencia legacy

| Comportamiento | Evidencia | Observación |
|---|---|---|
| Cambio autenticado de estado | `docs/legacy/misc_js.php`, tarea `status_change` | Sale sin mutar si no existe usuario o si `level_profile_status` está deshabilitado. Recorta a 100 caracteres, actualiza `user_status` y `user_status_date`, y llama `user_lastupdate()`. |
| Publicación del estado | `docs/legacy/misc_js.php`, `actions_add(..., "editstatus", ..., 600, false, "user", user_id, user_privacy)` | Solo publica si el estado no está vacío. El intervalo de 600 segundos permite actualizar la acción previa del mismo usuario/tipo. |
| Coalescencia y persistencia | `docs/legacy/include/class_actions.php::actions_add()` | `se_actions` contiene tipo, fecha, usuario, texto serializado, owner, owner ID y privacidad. El texto de acción usa `serialize()` de PHP. |
| Lectura del inicio | `docs/legacy/user_home.php` y `docs/legacy/templates/user_home.tpl` | El inicio carga `actions_display()` y limita por configuración, preferencias, visibilidad, privacidad y ocurrencias por usuario. |
| Actividad por red | `docs/legacy/include/class_actions.php::actions_display()` | Existen modos global, registrados, conexiones/subred y conexiones. La configuración efectiva de visibilidad, subred y preferencias no está confirmada. |
| Estados recientes | `docs/legacy/lateststatus.php`, `docs/legacy/ajax_get_recentstatus.php` | Consultan `se_users.user_status` y `user_status_date`; una variante filtra por subred y otra lista global. |
| UI de estado | `docs/legacy/templates/user_home.tpl` | Usuario autenticado y con nivel habilitado puede editar inline, máximo 100 caracteres; estado vacío muestra el control para añadirlo. |

Las tablas y columnas `se_actions`, `se_actiontypes`, `se_actionmedia`, `se_users.user_status`, `se_users.user_status_date` y `se_usersettings` están respaldadas por referencias de código, pero no existe dump MySQL verificable en este workspace. Los catálogos, índices, valores efectivos de settings y permisos de niveles permanecen pendientes.

## Contrato destino

### Actores y precondiciones

- **Usuario autenticado habilitado y verificado**: puede modificar únicamente su propio estado mediante `/account/profile` y leer `/home`.
- **Conexión aceptada**: puede aparecer en el feed del usuario autenticado si la actividad conserva una privacidad compatible.
- **Usuario anónimo**: no recibe el feed autenticado ni puede invocar la acción server-side.
- **Usuario bloqueado o bloqueador**: las actividades entre ambos se excluyen del feed.
- **Administrador/moderador**: fuera del alcance de este incremento; no se inventa bypass de privacidad.

### Entrada

`updateProfileSettingsAction` recibe `profilePrivacy` y `status` desde el formulario existente. El servidor:

- obtiene el actor desde la cookie de sesión, nunca desde un `userId` enviado por el cliente;
- valida la máscara de privacidad existente;
- recorta el estado y limita a 100 caracteres Unicode;
- representa vacío como `null`;
- no acepta HTML arbitrario ni ejecuta contenido como markup.

### Salida y navegación

- La acción devuelve estado de formulario de éxito o error y revalida `/account/profile`, `/home` y el perfil propio.
- `/home` devuelve actividad autenticada con actor, texto de estado, tipo `editstatus` y fecha presentada como tiempo relativo/localizado, sin serialización PHP ni datos internos.
- El perfil continúa mostrando el estado actual después de comprobar su privacidad.

### Persistencia destino

- `users.status` conserva el estado actual.
- `users.status_updated_at` conserva la fecha del último cambio de estado.
- `activities` representa la acción normalizada:
  - `actor_id` → usuario que ejecutó la acción;
  - `type` → `editstatus`;
  - `text` → estado canónico no HTML;
  - `created_at` → fecha de acción;
  - `object_privacy` → máscara de privacidad vigente al publicar.
- La operación de actualizar usuario y crear/actualizar actividad es transaccional.
- La coalescencia busca la actividad más reciente del actor y tipo dentro de 600 segundos; si existe, la actualiza; en otro caso crea una fila.
- Limpiar el estado no crea una nueva actividad ni borra retroactivamente la actividad previa, siguiendo el `if(trim($status) != "")` legacy.

### Lectura y privacidad

El feed moderno está deliberadamente acotado a usuario propio y conexiones `accepted`, porque no hay evidencia suficiente para reproducir settings globales de visibilidad, subredes o preferencias de `se_usersettings`. Para cada actividad se comprueba:

1. actor habilitado;
2. ausencia de bloqueo en cualquiera de las dos direcciones;
3. actor propio o conexión aceptada;
4. `object_privacy` compatible con el lector usando las máscaras de perfil existentes.

Las actividades se ordenan por fecha descendente y tienen un límite fijo documentado en el servicio hasta verificar `setting_actions_actionsinlist`. No se exponen `action_id` interno, texto serializado, IP, email ni timestamp en formato interno al cliente.

## Diferencias aceptadas y pendientes

| Diferencia | Estado | Motivo |
|---|---|---|
| `activities` normalizada en lugar de `se_actions` + `se_actiontypes` | Aceptada para este incremento | No hay dump ni catálogo verificable; el tipo único `editstatus` mantiene el comportamiento observado sin serialización PHP. |
| Sin `se_actionmedia` | Aceptada | El estado no usa medios; multimedia queda para otro vertical. |
| Feed propio/conexiones, sin subred ni feed global | Aceptada y documentada | Los settings efectivos y `user_subnet_id` no están confirmados. |
| Sin preferencias de tipos de actividad | Pendiente | Requiere catálogo `se_actiontypes` y `se_usersettings` verificable. |
| Sin permiso configurable `level_profile_status` | Pendiente | El destino no tiene niveles legacy confirmados; se exige usuario autenticado habilitado/verificado. |
| Fecha normalizada `DateTime` | Aceptada | La migración futura desde Unix deberá transformar `action_date`/`user_status_date` en un script reproducible. |
| Sin comentarios/notificaciones | Pendiente | No forman parte del cierre de estado y actividad mínima. |

## Casos de paridad

- Estado vacío inicial: formulario editable y feed vacío.
- Estado no vacío: se muestra en perfil propio y genera `editstatus`.
- Segundo cambio dentro de 600 segundos: una actividad del actor/tipo, con texto y fecha actualizados.
- Cambio posterior a 600 segundos: nueva actividad.
- Estado limpiado: `users.status` nulo; la actividad previa permanece.
- Privacidad de solo propietario: el autor ve su actividad; una conexión no la ve.
- Privacidad de conexiones: una conexión aceptada puede verla.
- Bloqueo: ninguna de las dos partes ve actividades de la otra.
- Usuario sin sesión: la operación de modificación falla y no cambia persistencia.
- Cuenta deshabilitada/no verificada: no puede usar la superficie autenticada.
