# Incremento 13 — Notificaciones de comentarios de perfil

## Selección

Se implementa el subconjunto verificable de notificaciones asociado a comentarios de perfil. El legacy confirma la existencia de `se_notifys`, el tipo de comentario de perfil `3`, el `notify_user_id` del destinatario y `notify_object_id` igual al propietario del perfil; `profile.php` elimina esas notificaciones cuando el propietario abre la vista de comentarios. El catálogo completo de `se_notifytypes`, plugins activos y configuración de email no está disponible, por lo que no se migran otros tipos.

## Evidencia legacy

| Comportamiento | Fuente | Observación |
|---|---|---|
| Persistencia de aviso | `docs/legacy/profile.php`, `docs/legacy/include/class_user.php` | se consulta/elimina `se_notifys` por destinatario, tipo y objeto; los comentarios disparan el tipo legacy `3` mediante la infraestructura de comentarios/notificaciones |
| Destinatario | `docs/legacy/profile.php` | el propietario del perfil es el usuario cuyo aviso se elimina al abrir comentarios |
| Objeto | `docs/legacy/profile.php` | `notify_object_id` se compara con el ID del propietario del perfil |
| Lectura/limpieza | `docs/legacy/profile.php`, `docs/legacy/misc_js.php` | abrir la superficie de comentarios o la operación de borrado de notificaciones limpia el aviso correspondiente |
| Efecto de correo | `docs/legacy/05-endpoints-integraciones.md`, clase legacy de comentarios | el correo depende de settings y plantillas no verificadas; queda fuera de este incremento |

No existe dump MySQL verificable ni catálogo completo de tipos. La correspondencia `3 → profile_comment` se conserva como `legacyTypeId=3` en la documentación, pero el destino usa un string estable para no acoplar UI a IDs legacy.

## Alcance destino

- Crear una notificación cuando un usuario autenticado publica un comentario en el perfil de otra persona autorizada.
- No notificar al autor cuando comenta su propio perfil.
- Mostrar al propietario sus notificaciones recientes de comentarios de perfil en `/home`.
- Excluir notificaciones cuyo actor esté deshabilitado.
- Mantener ownership server-side: el destinatario se deriva del perfil resuelto, nunca de un campo confiado del formulario.
- No enviar email, no notificar visitas, no notificar mensajes y no asumir tipos de plugins.

## Contrato destino

`getProfileNotifications(userId)` devuelve los avisos recientes visibles:

```text
{
  unreadCount: number,
  items: [{
    id: string,
    type: "profile_comment",
    actor: { username: string, displayName: string },
    profileOwnerUsername: string,
    createdAt: Date
  }]
}
```

La UI enlaza cada aviso al perfil propietario. La lectura no muta datos; la limpieza de avisos al abrir comentarios y el estado leído quedan pendientes hasta confirmar las columnas/semántica exactas de `se_notifys`.

## Persistencia destino

Se normaliza la tabla legacy referenciada `se_notifys` en `notifications`:

- `notify_user_id` → `recipient_id`;
- `notify_object_id` → `object_id` (ID del perfil propietario para este tipo);
- tipo legacy `3` → `type = "profile_comment"` y `legacy_type_id = 3`;
- actor del comentario → `actor_id`, relación explícita destino para renderizar el aviso sin resolver datos no autorizados;
- `created_at` es metadato destino para ordenar avisos recientes.

No se impone unicidad porque el legacy puede crear varios avisos del mismo tipo y objeto. Se añaden índices por destinatario/fecha y destinatario/tipo/fecha. La creación del comentario y la notificación se realiza en una transacción.

## Actores y autorización

- **Anónimo:** no puede crear comentarios y por tanto no genera avisos.
- **Autor autenticado verificado:** genera un aviso al propietario ajeno tras superar privacidad, amistad y bloqueos.
- **Propietario:** recibe y puede consultar sus avisos en `/home`.
- **Tercero:** no puede consultar avisos de otra cuenta.
- **Moderador/administrador:** no recibe bypass ni acceso adicional porque `moderation_privacy` y niveles no están verificados.

## Casos de paridad

| Caso | Resultado |
|---|---|
| Comentario ajeno autorizado | comentario y notificación se crean atómicamente |
| Comentario propio | comentario sin notificación al propio autor |
| Comentario rechazado por privacidad/bloqueo | no se crea comentario ni aviso |
| `/home` autenticado | solo muestra avisos del usuario de sesión |
| Actor deshabilitado | el aviso no se expone en la lista |
| Usuario no autenticado | no accede a `/home` |
| Error de transacción | no queda comentario sin su efecto secundario de notificación |

## Diferencias y pendientes

- La tabla destino añade `actor_id`, `legacy_type_id` y `created_at` para preservar trazabilidad y render seguro; no se afirma que sean columnas legacy equivalentes.
- No se implementa todavía la eliminación automática al abrir `/profile/[username]?v=comments` porque la ruta moderna no tiene esa vista separada y la semántica de lectura legacy completa requiere el catálogo de notificaciones.
- No se implementa email, agrupación, tipos de amistad/mensajes/etiquetas ni plugins.
- No se migran datos legacy por ausencia de dump verificable.
- El incremento no declara equivalencia del sistema completo de notificaciones; solo cubre el caso de comentarios de perfil con evidencia directa.
