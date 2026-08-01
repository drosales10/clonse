## Alcance

Se implementa `/admin/users` como lectura administrativa protegida. El comportamiento se basa en `docs/legacy/admin/admin_viewusers.php`, pero solo usa campos existentes y verificados del modelo `User` destino.

## Contrato

- Actor: administrador habilitado con `AdminSession` vigente.
- Entrada: `f_user`, `f_email`, `f_enabled`, `s` y `p`, conservando los nombres de consulta observados en legacy.
- Salida: total, página actual, total de páginas y hasta 100 usuarios con username, displayName, email, enabled, verifiedAt y signUpDate.
- Orden permitido: ID interno, username, email, verificación y fecha de alta, ascendente/descendente según el código legacy.
- Filtros: búsqueda de username/displayName, búsqueda de email y estado habilitado/deshabilitado.
- Autorización: `getAdminAccessState()` se ejecuta antes de consultar usuarios; una sesión normal de usuario no autoriza.

## Diferencias deliberadas

- El destino no tiene `user_level_id`, `user_subnet_id`, niveles ni subredes; esos filtros y columnas no se inventan.
- El ID destino es un `cuid` y no equivale al `user_id` entero legacy; se muestra solo como identificador técnico cuando procede.
- El listado es exclusivamente de lectura. Legacy permite borrar usuarios en `task=delete` y `task=dodelete`, pero esas acciones quedan fuera hasta definir ownership administrativo, confirmación, transacción, auditoría y efectos secundarios.
- No se exponen passwordHash, tokens, sesiones, datos dinámicos ni relaciones privadas.
- La privacidad de usuario no oculta al administrador autorizado el listado administrativo; el guard de administración es la frontera aplicable.

## Seguridad

La consulta se construye con filtros Prisma tipados y una lista cerrada de órdenes, sin SQL concatenado. El `page` se normaliza a entero positivo y el tamaño se fija server-side en 100. No se aceptan campos arbitrarios para `orderBy`.

## Implementación

- `src/server/admin/users.ts` construye un `Prisma.UserWhereInput` tipado y una lista cerrada de `orderBy`; no concatena SQL ni acepta campos arbitrarios.
- `src/app/admin/users/page.tsx` ejecuta el guard admin antes de consultar, conserva los parámetros legacy, muestra la tabla y ofrece filtros/paginación GET.
- `src/app/admin/dashboard/page.tsx` enlaza el módulo de usuarios.
- `src/app/globals.css` añade estilos responsive para filtros y tabla administrativa.

## Validación

- `pnpm exec tsc --noEmit` ✅
- `pnpm exec eslint src/server/admin/users.ts src/app/admin/users/page.tsx src/app/admin/dashboard/page.tsx` ✅
- `pnpm build` ✅; Next.js reconoce `/admin/users` como ruta dinámica protegida.
- `git diff --check` ✅; Windows solo informa normalización LF/CRLF.

## Pendientes

1. No se implementan `task=delete` ni `task=dodelete` del legacy.
2. No se implementa `/admin/users/[id]` ni edición de email, username, password, enabled, nivel, categoría o invitaciones.
3. Filtros de nivel y subred quedan pendientes de `UserLevel`/`Subnetwork` y su importación.
4. Antes de mutaciones deben definirse permisos por rol, confirmación server-side, transacción, auditoría, invalidación de sesiones y efectos secundarios de eliminación.
