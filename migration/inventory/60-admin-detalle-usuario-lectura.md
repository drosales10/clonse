## Alcance

Se implementa `/admin/users/[userId]` como detalle administrativo de lectura, respaldado por `admin_viewusers_edit.php`. La ruta requiere una sesión `AdminSession` válida y consulta el usuario por su ID interno destino.

## Datos visibles

- identidad: ID interno, username, displayName y email;
- estado: enabled y verifiedAt;
- fechas: signUpDate, lastLoginAt y lastActiveAt;
- estadísticas disponibles: conexiones aceptadas, comentarios de perfil authored y actividades authored.

No se consultan ni se serializan passwordHash, tokens de verificación/reset, cookies, sesiones ni campos privados dinámicos.

## Diferencias frente a legacy

- Legacy muestra y modifica niveles, subredes, categoría de perfil, invitaciones y actividad agregada de múltiples módulos. Esos catálogos/relaciones no están completos en el destino y no se inventan.
- Legacy calcula mensajes y comentarios sobre tablas variables; el detalle moderno solo muestra relaciones Prisma verificadas.
- Legacy permite reenviar verificación, verificar manualmente, editar y borrar; todas esas acciones quedan bloqueadas en este incremento.
- No se acepta `user_id` entero legacy como fallback porque aún no existe un `UserIdentityMap` administrativo verificado para resolverlo en esta superficie.

## Implementación

- `src/server/admin/user-detail.ts` valida primero la existencia por ID interno y cuenta únicamente relaciones Prisma verificadas: conexiones aceptadas en ambas direcciones, comentarios de perfil authored y actividades authored.
- `src/app/admin/users/[userId]/page.tsx` ejecuta el guard admin, muestra identidad/estado/fechas/estadísticas y redirige a `/admin/users` si el usuario no existe.
- `src/app/admin/users/page.tsx` enlaza cada usuario al detalle.
- `src/app/globals.css` añade estilos para el enlace y los bloques de estadísticas.

## Validación

- `pnpm exec tsc --noEmit` ✅
- `pnpm exec eslint src/server/admin/user-detail.ts src/app/admin/users/[userId]/page.tsx src/app/admin/users/page.tsx src/app/admin/dashboard/page.tsx` ✅
- `pnpm build` ✅; Next.js reconoce `/admin/users/[userId]` como ruta dinámica.
- `git diff --check` ✅; Windows solo informa normalización LF/CRLF.

## Pendientes

Las acciones `resend`, `verify`, `edituser`, `action_delete` y las eliminaciones de `admin_viewusers.php`/`admin_viewusers_edit.php` siguen sin transporte moderno. Antes de implementarlas se necesitan contratos de permisos, auditoría, invalidación de sesiones, transacciones y efectos secundarios de correo/contenido.
