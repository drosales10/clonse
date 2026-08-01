# Incremento 23 — Cambio de contraseña autenticado

## Alcance y evidencia

`docs/legacy/user_account_pass.php` recibe `password_old`, `password_new` y `password_new2` en `task=dosave`, delega validación en `SEUser::user_password()`, actualiza `se_users.user_password`, reconstruye el usuario y renueva las cookies mediante `user_setcookies()`.

Destino: sección `Seguridad` dentro de `/account/profile`, con Server Action independiente.

## Contrato

Entrada server-side:

- contraseña actual;
- nueva contraseña;
- confirmación de nueva contraseña.

Reglas conservadas del contrato moderno de acceso:

- nueva contraseña de mínimo 6 caracteres;
- caracteres alfanuméricos en esta fase;
- confirmación exacta;
- contraseña actual obligatoria y verificada contra el hash scrypt almacenado.

El formulario nunca recibe ni muestra el hash. El actor procede de la sesión y no de un `userId` enviado por el cliente.

## Efectos secundarios

- Actualiza `users.password_hash` con un nuevo salt/hash scrypt.
- Conserva la sesión actual para reproducir la renovación de sesión observable del legacy.
- Revoca otras sesiones activas del mismo usuario dentro de la transacción, reduciendo el riesgo de sesiones abandonadas.
- No envía email ni cambia `password_method`; el algoritmo legacy efectivo no está verificado.

## Errores y autorización

- Sesión ausente: error server-side, sin mutación.
- Cuenta inexistente, deshabilitada o no verificada: error genérico, sin mutación.
- Contraseña actual incorrecta: error genérico, sin revelar cuál credencial falló.
- Nueva contraseña inválida: errores de campo, sin tocar persistencia.
- La UI solo comunica estados; la autorización y verificación se realizan en `changeUserPassword`.

## Trazabilidad

| Destino | Legacy | Diferencia |
|---|---|---|
| `users.password_hash` | `se_users.user_password` | hash scrypt moderno frente a algoritmo configurable legacy |
| `auth_sessions` | cookies/Sesión legacy | se conservan sesión actual y se revocan sesiones restantes |
| `/account/profile` | `user_account_pass.php?task=dosave` | integración moderna en cuenta |

## Límites

- No se migra cambio de email/username porque requiere verificación, unicidad y correo configurado.
- No se reproduce `password_method` ni algoritmos MD5/legacy sin valores efectivos verificables.
- No se modifican PHP/MySQL ni se almacenan contraseñas reales en fixtures o logs.

## Smoke posterior preparado

Cuando se habilite la batería de verificaciones, cubrir al menos:

1. Usuario autenticado con contraseña actual correcta: la contraseña cambia, la sesión actual sigue operativa y una sesión secundaria deja de ser válida.
2. Contraseña actual incorrecta: se muestra error general y el hash/sesiones no cambian.
3. Nueva contraseña demasiado corta, no alfanumérica o confirmación distinta: se muestran errores de campo y no hay mutación.
4. Sesión ausente, cuenta deshabilitada o no verificada: la acción no modifica persistencia.
5. Verificar que no aparecen contraseñas, hashes ni tokens en HTML, respuestas de acción o logs.

Validación realizada en esta fase: `pnpm exec tsc --noEmit`, `pnpm lint` y `git diff --check` correctos. La batería funcional completa y el smoke HTTP con datos controlados quedan pospuestos según el plan de implementación.
