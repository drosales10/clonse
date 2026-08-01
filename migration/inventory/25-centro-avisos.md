# Incremento 25 — Centro de avisos y marcado como leído

## Alcance y evidencia

El legacy muestra avisos en `user_home.php` mediante `se_notify` y mantiene la limpieza contextual del aviso de comentario al abrir `profile.php?v=comments`. Los tipos verificables en el destino son `profile_comment` (legacy 3) y `friend_request` (legacy 1), ya documentados en los incrementos 13 y 18.

El destino añade `/account/notifications` para consultar esos avisos y marcar los avisos propios como leídos usando `notifications.read_at`. No se introducen tipos de plugins, correo ni mensajería.

## Contrato

- Solo un usuario autenticado puede abrir el centro.
- La lectura devuelve como máximo los avisos existentes del destinatario de la sesión, ordenados del más reciente al más antiguo.
- Se muestran actor, tipo, fecha y enlace permitido al perfil relacionado.
- La acción POST `/account/notifications/read` solo actualiza filas cuyo `recipientId` coincide con la sesión y cuyo `readAt` es nulo.
- No se acepta una lista de IDs ni un destinatario desde el formulario.

## Privacidad y autorización

El servicio selecciona explícitamente los campos públicos del actor y del propietario del perfil. Los actores deshabilitados no se muestran. La acción y la página resuelven el usuario desde la cookie HTTP-only; ocultar el enlace no es el control de seguridad.

## Efectos secundarios

- Marcar como leído actualiza `read_at` y reduce el contador de no leídos.
- No elimina avisos; la limpieza contextual existente de comentarios continúa usando `profile/[username]?v=comments`.
- No envía correo ni genera notificaciones nuevas.
- No requiere migración Prisma: `Notification.readAt` e índices por destinatario ya existen.

## Diferencia deliberada

El legacy observado limpia algunos avisos al abrir una superficie concreta. El centro moderno conserva el aviso y ofrece marcado explícito como leído; es una extensión de UX sobre la columna destino existente, no una afirmación de paridad completa con todos los tipos o plugins de `se_notifys`.

## Smoke posterior

Con usuarios sintéticos: un usuario solo ve avisos propios; actores deshabilitados se excluyen; los dos tipos aparecen ordenados; marcar como leídos reduce el contador sin cambiar destinatario ni avisos de otra cuenta; una sesión ausente redirige a login; no se exponen IDs internos innecesarios, hashes, tokens ni emails.
