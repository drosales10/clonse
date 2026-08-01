# Incremento 02 — Cuenta: privacidad y estado

## Alcance

Este incremento migra una superficie autenticada mínima para que el usuario actualice:

- privacidad de su perfil;
- estado breve visible en el perfil.

Ruta destino: `/account/profile`.

No se migran todavía email, username, zona horaria, preferencias de notificación, blocklist, privacidad de comentarios, búsqueda, campos dinámicos, foto, categoría, subred, acciones ni niveles. Esas capacidades permanecen pendientes porque requieren tablas/configuración legacy no confirmadas.

## Fuentes legacy

| Comportamiento | Fuente |
|---|---|
| Página autenticada de privacidad | `docs/legacy/user_account_privacy.php` |
| Persiste `user_privacy` y otros ajustes en `se_users` | `docs/legacy/user_account_privacy.php` |
| Opciones permitidas provienen de `level_profile_privacy` | `docs/legacy/user_account_privacy.php` |
| Estado requiere usuario autenticado y permiso `level_profile_status` | `docs/legacy/misc_js.php`, rama `task=status_change` |
| Estado se limita a 100 caracteres y se guarda con fecha Unix | `docs/legacy/misc_js.php`, rama `task=status_change` |
| El cambio de estado puede publicar acción `editstatus` | `docs/legacy/misc_js.php` |

## Actores y autorización

- **Visitante:** no puede acceder; la página redirige a `/login?returnUrl=/account/profile`.
- **Usuario autenticado:** solo puede actualizar el usuario asociado a su sesión. No se acepta `userId`, `username` ni un identificador de propietario desde el formulario.
- **Administración:** fuera del alcance; no se reutiliza esta acción como capacidad administrativa.
- **Permiso de estado:** el legacy lo condiciona al nivel. Como aún no existe `UserLevel` destino, esta entrega permite el campo a cualquier usuario autenticado y deja la diferencia registrada.

La autorización se ejecuta en la Server Action y en el servicio server-side. Ocultar la ruta o el botón no constituye control de seguridad.

## Contrato de entrada

Formulario `POST` mediante Server Action:

```text
profilePrivacy: string entero perteneciente a {0, 1, 3, 7, 15, 31, 63}
status: string opcional, máximo 100 caracteres Unicode después de trim
```

Los valores de privacidad son máscaras acumulativas legacy:

- `0`: nadie salvo propietario;
- `1`: propietario;
- `3`: propietario y amistades;
- `7`: conexiones hasta amigo de amigo/subred según el modelo legacy;
- `15`: red de conexiones;
- `31`: usuarios registrados;
- `63`: todos, valor inicial por defecto.

En el primer incremento moderno no existen amistades, subredes ni niveles; la lectura pública solo puede evaluar propietario, usuario registrado y anónimo mediante los bits `1`, `16` y `32`.

## Salida y errores

Éxito:

- persiste ambos campos en una transacción Prisma;
- actualiza `updatedAt` automáticamente;
- devuelve estado de formulario exitoso;
- la UI muestra un mensaje de confirmación sin exponer datos internos.

Errores esperados:

- sesión ausente: redirección a login desde la página; la acción devuelve error de autenticación si se invoca directamente;
- privacidad ausente, no numérica o fuera de la lista permitida: error de campo;
- estado superior a 100 caracteres: error de campo;
- estado vacío: se persiste como `NULL`, equivalente a eliminar el estado visible;
- error de persistencia: mensaje genérico, sin SQL ni detalles de infraestructura.

## Efectos secundarios

Persistidos:

- `users.profile_privacy`;
- `users.status`;
- `users.updated_at` mediante Prisma.

No implementados deliberadamente:

- `user_lastupdate()` y `user_status_date` separados del legacy;
- acción `editstatus` en `se_actions`;
- notificaciones o correo;
- invalidación de cachés legacy;
- cambios de relaciones o subred.

La diferencia de fecha se resuelve usando `updatedAt` como marca de modificación del registro mientras no exista un campo de estado separado en el destino.

## Mapa legacy → Next.js

| Legacy | Next.js | Estado |
|---|---|---|
| `user_account_privacy.php?task=dosave` | `updateProfileSettingsAction` | Este incremento |
| `se_users.user_privacy` | `users.profile_privacy` | Implementado |
| `misc_js.php?task=status_change` | mismo formulario autenticado | Este incremento, sin acción social |
| `se_users.user_status` | `users.status` | Implementado |
| `se_users.user_status_date` | `users.updated_at` | Diferencia documentada |
| `se_levels.level_profile_privacy` | constantes de dominio | Solo máscaras observadas; catálogo de nivel pendiente |
| `se_levels.level_profile_status` | — | Pendiente; se permite a usuario autenticado |
| `se_actions` | — | Pendiente |
| `se_usersettings` y preferencias | — | Fuera de alcance |

## Criterios de aceptación

1. Un usuario sin sesión no puede leer ni mutar `/account/profile`.
2. Un usuario autenticado puede guardar una máscara válida y un estado de hasta 100 caracteres.
3. Una máscara inválida no modifica la base de datos.
4. Un estado de 101 caracteres no modifica la base de datos.
5. Un estado vacío se guarda como `NULL`.
6. No existe parámetro de usuario que permita modificar otra cuenta.
7. La lectura de `/profile/[username]` refleja la privacidad y el estado guardados.
8. El formulario no revela email, hash, token, sesión ni SQL.
9. La operación es idempotente para el mismo payload.
10. No se modifica ningún archivo bajo `docs/legacy`.

## Verificación prevista

- lint, TypeScript, Prisma validate/status y build con pnpm;
- smoke de dominio para máscaras válidas/ inválidas y límite de estado;
- smoke de persistencia con usuario sintético, comprobando actualización y limpieza posterior;
- smoke HTTP de página autenticada sin sesión y página pública después de guardar;
- resultado y diferencias conservados en este inventario.
