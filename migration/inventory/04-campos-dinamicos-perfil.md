# Incremento 03 — Campos dinámicos de perfil

## Alcance

Este incremento prepara e implementa la lectura y edición segura de campos dinámicos de perfil mediante metadata normalizada. Solo se procesan definiciones existentes en `profile_categories` y `profile_fields`; no se inventan campos ni se importan datos MySQL automáticamente porque no hay dump verificable.

Tipos soportados en esta fase, equivalentes a `se_field.field_type` 1–6:

| Legacy | Destino | Valor canónico |
|---:|---|---|
| 1 | `text` | `string` |
| 2 | `textarea` | `string` sin HTML |
| 3 | `select` | `string` de una opción permitida |
| 4 | `radio` | `string` de una opción permitida |
| 5 | `date` | `YYYY-MM-DD` válido |
| 6 | `checkbox` | `string[]` de opciones permitidas |

La UI se integra en `/account/profile`. El perfil público solo muestra campos con `displayMode != 0` después de comprobar la privacidad global del propietario.

Fuera de alcance: importación desde PHP-serialize, creación administrativa de campos, regex legacy, HTML permitido, campos de búsqueda, dependencias dinámicas complejas, special fields que recalculan nombre/subred, categorías editables por usuario, fotos, amistades, bloqueos, comentarios, visitas y acciones sociales.

## Evidencia legacy

| Comportamiento | Fuente |
|---|---|
| Categorías raíz/subcategorías, orden y dependencia | `class_field.php::cat_list()`; `se_profilecats` |
| Metadata de campos | `class_field.php::field_list()`; `se_profilefields` |
| Valores en columnas dinámicas | `class_user.php::getProfileValues()` y `user_editprofile.php`; `se_profilevalues` |
| Tipos 1–6 y controles de formulario | `class_field.php`; `templates/signup.tpl` |
| Campos requeridos, maxlength y opciones | `class_field.php` |
| Regex y HTML administrables | `class_field.php` — no habilitados en esta fase |
| Guardado, caché, nombre, subred y acción | `user_editprofile.php` — solo el guardado de valores se migra aquí |
| Visibilidad global por máscara y `field_display` | `profile.php`, `class_field.php` |

## Modelo destino

- `ProfileCategory`: `legacyId`, nombre ya resuelto, orden, categoría padre opcional y estado activo.
- `ProfileField`: `legacyId`, categoría, tipo estable como string validado, label/descripción, orden, required, maxlength, opciones JSON, display mode, dependencia opcional y estado activo.
- `ProfileFieldValue`: relación única usuario/campo y valor JSON canónico.
- `User.profilePrivacy`: sigue siendo la autoridad global para determinar si el perfil y sus campos son visibles.

Los `legacyId` son opcionales para permitir definiciones nuevas controladas, pero deben conservarse durante una importación. Los nombres/títulos PHP serializados deben transformarse a texto antes de persistirse; no se versionan dumps ni serializaciones reales.

## Contrato de lectura

### Usuario propietario

`GET /account/profile` obtiene categorías/campos activos ordenados y los valores del usuario de la sesión. El email, hash, tokens y sesiones nunca forman parte del DTO.

### Perfil público

`GET /profile/[username]` obtiene solo campos activos cuyo `displayMode != 0`, y únicamente después de `canViewProfile(ownerId, profilePrivacy, viewerId)`. Si el perfil es privado, no se consulta ni se renderiza ningún valor dinámico.

`displayMode=2` conserva la intención legacy de enlazar valores, pero en esta fase se muestra texto escapado sin construir URLs porque el contrato de links no está migrado.

## Contrato de escritura

La Server Action de `/account/profile` acepta campos con nombres internos `field_<id>` generados por el servidor. No acepta `userId`, `username`, `categoryId` ni una definición de campo desde el cliente.

Para cada ID recibido, el servidor vuelve a cargar la definición activa y valida:

- tipo soportado;
- required;
- longitud Unicode y `maxlength`;
- opción permitida para select/radio;
- conjunto permitido para checkbox;
- fecha completa y calendario válido para date;
- ausencia de HTML/regex no soportado.

Los campos no presentes se consideran vacíos solo si la definición permite vacío; de lo contrario no se actualizan. La persistencia usa upsert por `(userId, fieldId)` y elimina el valor cuando el usuario deja el campo vacío.

## Seguridad y ownership

- La página y la Server Action requieren sesión HTTP-only válida.
- El `userId` se obtiene exclusivamente de `getCurrentUser()`.
- Un usuario no puede escribir valores de otra cuenta aunque conozca su ID o el ID de un campo.
- La definición se consulta desde PostgreSQL y no se confía en labels, tipo u opciones enviados por el navegador.
- Los valores se renderizan como texto React; no se interpreta HTML legacy.
- Las consultas Prisma permanecen en servicios server-side.

## Efectos secundarios y diferencias

Persistidos:

- valores normalizados en `profile_field_values`;
- `updatedAt` de cada valor.

No implementados:

- columnas `profilevalue_value_<id>` legacy;
- caché `site_user_profiles_*`;
- `field_special` para nombre/subred;
- `user_lastupdate()`;
- acción `editprofile`;
- dependencias que muestran/ocultan subcampos en el navegador;
- filtros y búsquedas por campos;
- HTML autorizado por administrador;
- resolución de etiquetas de idioma PHP.

## Criterios de aceptación

1. Con metadata vacía, la cuenta muestra estado vacío y no inventa campos.
2. Un campo de texto, textarea, select, radio, checkbox o fecha configurado se muestra con su valor canónico.
3. Un valor inválido no modifica otros campos ni la cuenta ajena.
4. Un usuario autenticado solo modifica sus propios valores.
5. Un perfil público privado no carga valores dinámicos.
6. Los campos ocultos (`displayMode=0`) no aparecen en el perfil público.
7. Los valores checkbox no aceptan opciones fuera de metadata.
8. La UI no puede habilitar HTML ejecutable ni regex arbitrario.
9. La operación es reanudable/idempotente por usuario y campo.
10. No se modifica `docs/legacy` ni se versionan datos reales.

## Pendientes de paridad

- Obtener esquema MySQL real y transformar `serialize()` de opciones.
- Resolver idiomas `SE_Language` y títulos numéricos.
- Migrar niveles/categorías efectivas y permisos por instalación.
- Implementar dependencias, campos especiales, búsqueda y links.
- Comparar perfiles sintéticos y perfiles reales anonimizados contra el legacy.
