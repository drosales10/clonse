# Incremento 19 — Verificación de email y recuperación de contraseña

## Selección y evidencia

Este incremento cierra dos contratos de acceso ya preparados en el destino y respaldados por los controladores legacy:

| Flujo | Legacy | Destino |
|---|---|---|
| Verificación de email | `docs/legacy/signup_verify.php` | `/verify?token=` + `verifyEmailAction` |
| Reenvío de verificación | `docs/legacy/signup_verify.php?task=resend` | `/verify` + `resendVerificationAction` |
| Solicitud de recuperación | `docs/legacy/lostpass.php?task=send_email` | `/forgot-password` + `requestPasswordResetAction` |
| Restablecimiento | `docs/legacy/lostpass_reset.php?task=reset` | `/reset-password?token=` + `resetPasswordAction` |

El legacy almacena códigos en claro/derivados en `se_users`/`se_usersettings` y envía correo. El destino conserva únicamente hashes SHA-256 de tokens aleatorios, con expiración de 24 horas y enlaces de desarrollo explícitos cuando no está en producción.

## Contrato y seguridad

- Los tokens crudos solo aparecen en el enlace de entrega y nunca se persisten ni se registran.
- `verificationTokenHash` y `passwordResetTokenHash` se limpian al consumir correctamente o cuando un token caduca.
- Un token es de un solo uso; repetirlo devuelve error sin cambiar la cuenta.
- La solicitud de recuperación devuelve siempre un mensaje genérico, exista o no la cuenta, evitando enumeración por email.
- El reenvío rota el token anterior para cuentas no verificadas.
- El reset actualiza la contraseña y revoca todas las sesiones existentes dentro de una transacción.
- La UI no constituye autorización: las Server Actions validan formato, token, expiración y persistencia en el servidor.

## Trazabilidad de datos

| Destino | Legacy | Diferencia documentada |
|---|---|---|
| `users.verification_token_hash` | `se_users.user_code` + `md5(user_code)` | El destino no guarda el token en claro y usa hash SHA-256 de un token aleatorio. |
| `users.verification_sent_at` | parámetro `d`/momento de envío | El destino controla expiración de 24 horas; legacy no la valida de la misma forma. |
| `users.verified_at` | `se_users.user_verified` | Boolean legacy normalizado a fecha de verificación. |
| `users.password_reset_token_hash` | `se_usersettings.usersetting_lostpassword_code` | Hash server-side en vez de código claro. |
| `users.password_reset_sent_at` | `usersetting_lostpassword_time` | `DateTime` destino derivado del timestamp legacy. |
| `auth_sessions` | cookie/sesión legacy | El reset revoca sesiones destino; legacy conserva sesiones según evidencia observada. |

## Actores, entradas y errores

- Visitante con token: puede consumir únicamente el token recibido.
- Visitante sin token: puede solicitar reenvío o recuperación mediante email válido.
- Usuario autenticado: no recibe un bypass especial ni puede verificar/resetear otra cuenta por ID.
- Cuenta deshabilitada: no puede autenticarse; las solicitudes de recuperación no generan enlace.
- Token ausente, inválido, manipulado o reutilizado: mensaje genérico y ninguna mutación.
- Token caducado: mensaje específico de caducidad y limpieza del hash almacenado.
- Password inválido: error de validación y ningún cambio de contraseña.

## Casos de paridad

| Caso | Resultado esperado | Evidencia |
|---|---|---|
| Verificación válida | `verifiedAt` se establece y token se limpia | smoke HTTP + DB sintética |
| Verificación repetida | error; no se vuelve a mutar | smoke |
| Verificación caducada | error de expiración y token limpiado | smoke |
| Reenvío pendiente | rota hash y entrega enlace de desarrollo fuera de producción | contrato/UI; SMTP bloqueado |
| Recuperación de email inexistente | respuesta genérica sin token | acción server-side |
| Reset válido | cambia hash, limpia token y revoca sesiones | smoke HTTP + DB sintética |
| Reset caducado | error de expiración y token limpiado | smoke |
| Password inválido | no cambia hash | validación de dominio/acción |

## Limitaciones

- No se implementa ni afirma envío SMTP real, porque proveedor, credenciales, plantillas y `se_settings` no están verificados.
- El enlace de desarrollo solo se expone cuando `NODE_ENV` no es `production`; no es una integración de correo.
- No se reproduce `user_subnet_select`, bienvenida, acción `signup` ni hooks de plugins del flujo legacy de verificación.
- No se declara equivalencia del catálogo completo de seguridad, niveles o preferencias de correo.
- No se añade migración Prisma: los campos de tokens y fechas ya existen en `User`.

## Evidencia ejecutable

`migration/scripts/access-recovery-http-smoke.mjs` comprueba que las rutas `/verify`, `/forgot-password` y `/reset-password` responden y que los fixtures sintéticos cubren consumo, caducidad, limpieza de tokens, cambio de contraseña y revocación de sesiones. Las Server Actions de `useActionState` se ejecutan normalmente desde el navegador; su atributo HTML queda vacío en una petición Node directa, por lo que el script no presenta una invocación HTTP artificial como prueba de la acción. La compilación TypeScript y el build validan sus contratos, mientras que la persistencia sintética verifica los invariantes de datos sin tocar cuentas reales.
