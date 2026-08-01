# Vertical 01 — Acceso e identidad

## Decisión de alcance

La primera vertical implementable es **acceso e identidad** porque todas las superficies autenticadas de SocialEngine dependen de ella. La entrega inicial cubre la entrada pública, login, registro básico, sesión y logout. No declara paridad completa: verificación de correo, recuperación de contraseña, campos dinámicos, invitaciones, foto y hooks quedan como siguientes incrementos.

## Evidencia legacy

| Comportamiento | Fuente observada |
|---|---|
| Login con `email`, `password`, `persistent` y `return_url` | `docs/legacy/login.php` |
| Validación de cuenta habilitada y email verificado | `docs/legacy/include/class_user.php::user_login()` |
| Contraseña mínima de seis caracteres y alfanumérica | `docs/legacy/include/class_user.php::user_password()` |
| Registro por pasos y validación de email/username | `docs/legacy/signup.php`, `class_user.php::user_account()` |
| Sesión, identidad derivada y logout | `class_user.php::user_setcookies()`, `user_logout()` |
| Redirección al inicio autenticado | `docs/04-flujos-operativos.md` |

## Contrato funcional inicial

### Actores

- Visitante anónimo: puede consultar `/`, `/login` y `/signup`.
- Usuario autenticado: puede consultar `/home` y cerrar sesión.
- Administración: fuera del alcance de esta vertical; no se reutiliza la sesión de usuario como autorización administrativa.

### Entradas

- Login: `email`, `password`, `persistent`, `returnUrl`.
- Registro inicial: `email`, `username`, `password`, `passwordConfirmation`, `termsAccepted`.
- Logout: solo la sesión HTTP actual.

### Salidas y estados

- Éxito de login/registro: cookie HTTP-only de sesión y redirección a `/home` o a una ruta interna indicada por `returnUrl`.
- Error de validación: errores por campo sin crear sesión.
- Error de credenciales: mensaje genérico para no revelar si el email existe.
- Cuenta no habilitada o no verificada: rechazo del login. La verificación real todavía requiere el adaptador de correo y settings legacy.

### Permisos y efectos secundarios

- Cada mutación valida el payload en servidor.
- La UI no es el control de autorización; `/home` vuelve a comprobar la sesión en el servidor.
- El almacenamiento de usuarios y sesiones usa Prisma sobre PostgreSQL `clonse`, con la migración inicial aplicada en `packages/db/prisma/migrations/20260801125121_access_identity/`.
- La cookie es `httpOnly`, `sameSite=lax`, `path=/` y `secure` en producción o cuando `SECURE_COOKIES=true`.
- La base contiene solo el contrato de identidad inicial; no se modifican PHP/MySQL ni se envían correos desde esta entrega.

## Mapa legacy → destino

| Legacy | Next.js inicial | Destino de dominio | Estado |
|---|---|---|---|
| `login.php` + `templates/login.tpl` | `/login` + `loginAction` | `packages/domain/src/access.ts` | Implementado |
| `signup.php` pasos 1–2 | `/signup` + `registerAction` | `packages/domain/src/access.ts` | Implementado parcialmente |
| `user_logout.php` | formulario en `/home` + `logoutAction` | `src/server/auth/session.ts` | Implementado |
| `user_home.php` | `/home` | DTO de sesión | Implementado como superficie mínima |
| `signup_verify.php` | pendiente | `User.verificationToken` | Contrato preparado, no implementado |
| `lostpass.php` / `lostpass_reset.php` | pendiente | caso de uso de recuperación | No implementado |
| `se_users` / `se_usersettings` | `users` + `auth_sessions` | `packages/db/schema.prisma` | Migración inicial aplicada en PostgreSQL |

1. La base `clonse` estaba vacía según `prisma db pull --print` (P4001); la migración inicial fue aplicada sin operaciones destructivas.
2. `prisma migrate status` confirma una migración aplicada y el schema sincronizado.
3. Un smoke test sintético creó un usuario y una sesión, verificó la relación `auth_sessions.user_id → users.id` y limpió ambos registros; no dejó datos de prueba.
4. `npm run db:validate`, `npm run db:generate`, `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan correctamente.

## Diferencias deliberadas y pendientes

1. La persistencia Prisma ya está activa para usuarios y sesiones. La creación de usuarios confirma localmente la cuenta porque todavía no existe un adaptador de correo; la verificación legacy debe añadirse antes de producción.
2. No se implementan CAPTCHA/código de seguridad, invitaciones, categorías, campos dinámicos, foto, acciones sociales ni hooks porque dependen de settings/plugins no confirmados.
3. No se afirma paridad cerrada hasta ejecutar una comparación controlada contra PHP/MySQL con settings y esquema efectivos.

## Siguiente secuencia vertical

1. Implementar tokens de verificación y recuperación con correo real mediante adaptador.
2. Reproducir registro multistep, campos dinámicos, invitación y efectos secundarios.
3. Añadir pruebas de contrato, permisos y recorrido Playwright contra fixtures sintéticos.

## Contratos de verificación y recuperación

| Flujo | Entrada moderna | Persistencia | Expiración | Consumo | Diferencia legacy |
|---|---|---|---|---|---|
| Verificar email | `/verify?token=<token>` | `users.verification_token_hash`, `verification_sent_at`, `verified_at` | 24 horas | Un solo uso; hash y fecha se limpian | Legacy usa `md5(user_code)` y genera `d`, pero no valida expiración |
| Reenviar verificación | Email del registro | Rota el hash y la fecha | 24 horas desde el reenvío | El token anterior deja de servir | Legacy busca `user_newemail` y reenvía el mismo derivado |
| Solicitar recuperación | Email | `users.password_reset_token_hash`, `password_reset_sent_at` | 24 horas | Un solo uso | Legacy guarda el código en `se_usersettings` y lo limpia al reset |
| Restablecer contraseña | `/reset-password?token=<token>` + dos passwords | Actualiza `password_hash`, limpia reset y revoca sesiones | Token válido y no caducado | Un solo uso | Legacy conserva sesiones y usa el método de password configurado |

Los tokens nunca se guardan en claro ni se escriben en logs. Las respuestas de solicitud de recuperación y reenvío son genéricas para no revelar si un email existe. La entrega real por correo queda detrás de un adaptador pendiente; en `development` se muestra un enlace de prueba de forma explícita y no se presenta como integración SMTP real.
