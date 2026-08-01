# Comentarios de perfil

## Alcance del incremento

Este vertical migra la conversación de comentarios asociada al perfil de una persona:

- lectura de comentarios cuando el perfil es visible para el lector;
- alta de un comentario por usuario autenticado autorizado;
- edición del propio comentario;
- borrado del propio comentario o por el propietario del perfil;
- máscara separada de privacidad para comentarios;
- exclusión de ambas partes cuando existe un bloqueo.

La UI destino se integra en `/profile/[username]`. No se implementan todavía notificaciones, CAPTCHA, HTML configurable, comentarios de objetos multimedia, respuestas anidadas, moderadores por nivel ni paginación avanzada.

## Evidencia legacy

| Comportamiento | Evidencia | Regla observada |
|---|---|---|
| Visibilidad del perfil | `docs/legacy/profile.php` | Calcula `privacy_max` del propietario y corta el flujo si la máscara no permite ver el perfil. |
| Permiso separado para comentar | `docs/legacy/profile.php` | Calcula `allowed_to_comment = ($privacy_max & $owner->user_info['user_comments'])`; no equivale necesariamente a la privacidad general del perfil. |
| Lectura de conversación | `docs/legacy/profile_comments.php` | Carga los comentarios donde los dos propietarios son la pareja consultada, en orden `profilecomment_date DESC`; ambos perfiles deben existir y ser visibles. |
| Lectura AJAX genérica | `docs/legacy/misc_js.php`, `comment_get` | Usa tipo `profile`, identificador `user_id`, valor del ID del propietario, paginación y `se_comment`. |
| Alta | `docs/legacy/misc_js.php`, `comment_post` | Exige sesión, objeto/propietario existente, permisos de comentario y campos de objeto; delega persistencia y validación de cuerpo a `se_comment::comment_post()`. |
| Edición | `docs/legacy/misc_js.php`, `comment_edit` | Exige sesión, comentario y objeto; delega la edición a `se_comment::comment_edit()`. La autorización final depende de la clase de comentario legacy. |
| Borrado | `docs/legacy/misc_js.php`, `comment_delete` | Exige sesión, resuelve el autor del comentario y permite al autor o a quien tenga `moderation_privacy`; delega borrado a `se_comment::comment_delete()`. |
| UI | `docs/legacy/templates/profile_core_comments.tpl`, `profile_comments.tpl`, `profile.tpl` | Muestra pestaña si hay comentarios o permiso para comentar; usa `type=profile`, `typeIdentifier=user_id`, `typeTab=users`, `typeCol=user`, con 10 elementos por página. |

La tabla `se_profilecomments` y sus columnas `profilecomment_id`, `profilecomment_user_id`, `profilecomment_authoruser_id`, `profilecomment_date` y `profilecomment_body` están confirmadas por consultas y plantillas. No existe dump MySQL verificable; restricciones, CAPTCHA, longitud efectiva, sanitización HTML, índices y reglas internas completas de `se_comment` permanecen pendientes.

## Actores y permisos destino

- **Anónimo**: puede leer comentarios solo si el perfil es visible para acceso anónimo; no puede crear, editar ni borrar.
- **Usuario autenticado habilitado y verificado**: puede leer comentarios visibles y crear si `commentsPrivacy` lo permite.
- **Autor del comentario**: puede editar o borrar su propio comentario.
- **Propietario del perfil**: puede borrar comentarios de su perfil como capacidad de gestión del objeto.
- **Usuario bloqueado/bloqueador**: no puede leer ni modificar la conversación del otro lado.
- **Moderador/administrador**: no recibe bypass en este incremento porque no hay niveles ni `moderation_privacy` efectivos confirmados.

La autorización siempre usa la sesión server-side y el ID del propietario resuelto por username; nunca acepta un `authorId` o un permiso procedente del cliente.

## Contrato de entrada

### Lectura

La página recibe `username` en la ruta. El servidor resuelve el usuario habilitado, evalúa bloqueo, amistad y `profilePrivacy`, y solo después carga comentarios. Los comentarios se limitan a los 50 más recientes mientras se verifica el setting legacy de paginación.

### Alta

La Server Action recibe `ownerUsername` y `body`:

- obtiene el actor desde la sesión;
- resuelve el propietario habilitado;
- comprueba que ambos perfiles no estén bloqueados;
- comprueba que el actor pueda ver el perfil;
- comprueba `commentsPrivacy` con la misma máscara de acceso (owner, friend, registered, anonymous);
- recorta el cuerpo y exige entre 1 y 2.000 caracteres Unicode;
- almacena texto plano, sin ejecutar HTML recibido.

El límite de 2.000 caracteres y el rechazo de HTML son una decisión de seguridad del destino mientras no se pueda verificar `setting_comment_html`, `setting_comment_code` ni la validación efectiva de `se_comment`.

### Edición y borrado

Las acciones reciben el `commentId` y el `ownerUsername` solo como localizadores. El servidor vuelve a resolver el comentario y autoriza:

- edición: únicamente el autor;
- borrado: autor o propietario del perfil.

Los IDs enviados no sirven como autorización. Un comentario de otro perfil o de un usuario no autorizado devuelve error estable y no muta datos.

## Persistencia destino

- `users.comments_privacy` conserva la máscara equivalente a `user_comments`.
- `profile_comments` normaliza `se_profilecomments`:
  - `profile_owner_id` → `profilecomment_user_id`;
  - `author_id` → `profilecomment_authoruser_id`;
  - `body` → `profilecomment_body`;
  - `created_at` → `profilecomment_date`;
  - `updated_at` es nuevo para soportar edición auditable en el destino.
- Las relaciones a usuarios usan `ON DELETE CASCADE`, evitando huérfanos cuando se elimina una cuenta.
- La creación, edición y borrado se ejecutan mediante Prisma y filtros server-side; la publicación no genera actividad `editstatus`.

## Salida y UI

`PublicProfile` incorpora:

- `comments`: ID opaco, cuerpo, fecha, autor público y `canDelete` calculado server-side;
- `canComment`: permiso calculado para el viewer.

La interfaz muestra:

- estado vacío cuando no hay comentarios;
- formulario solo para sesión y permiso válido;
- errores de validación/autorización sin `alert`, `confirm` ni `prompt`;
- comentarios en orden descendente;
- editar/borrar únicamente donde el DTO lo permite, manteniendo la verificación server-side;
- nombres y cuerpos escapados por React.

## Diferencias aceptadas y pendientes

| Diferencia | Estado | Motivo |
|---|---|---|
| `profile_comments` en lugar de `se_profilecomments` | Aceptada | Es normalización destino con trazabilidad explícita y FK. |
| 50 comentarios iniciales sin paginación | Aceptada provisional | Legacy usa AJAX/cpp 10, pero el contrato completo de paginación requiere reproducir `se_comment`; se deja pendiente. |
| `commentsPrivacy` separado | Aceptada | Legacy tiene `user_comments` separado de `user_privacy`; evita hacer público el permiso por conveniencia. |
| Texto plano y 2.000 caracteres | Aceptada de seguridad | Settings HTML/CODE y límites efectivos no verificables; se rechaza XSS hasta disponer de contrato. |
| Sin notificación al propietario | Pendiente | `se_notifys` y tipo 3 están referenciados en `profile.php`, pero no existe modelo destino ni catálogo verificable. |
| Sin CAPTCHA | Pendiente | El parámetro `comment_secure` existe en legacy, pero no se conoce la configuración/proveedor efectivo. |
| Sin moderación de nivel | Pendiente | `moderation_privacy` y niveles legacy no están confirmados en el destino. |
| Sin comentarios de álbum/blog/evento | Fuera de alcance | Este vertical solo cubre `type=profile`. |

## Casos de paridad

- Perfil público sin comentarios: lectura 200 y estado vacío.
- Perfil privado: no se cargan comentarios ni formulario.
- Anónimo sobre perfil público: puede leer, no puede publicar.
- Usuario registrado autorizado: puede publicar texto válido.
- Estado vacío o >2.000 caracteres: error y ninguna fila nueva.
- HTML recibido: se trata como texto y no se ejecuta.
- Autor: puede editar/borrar su comentario, no el de otra persona.
- Propietario: puede borrar comentario ajeno de su perfil.
- Usuario no relacionado: no puede borrar ni editar.
- Bloqueo en cualquiera de las direcciones: conversación oculta y mutaciones rechazadas.
- Eliminación de usuario: comentarios relacionados se eliminan por cascada.
