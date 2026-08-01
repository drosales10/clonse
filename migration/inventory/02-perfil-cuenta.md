# Vertical 02 — Perfil y cuenta

## Alcance de este incremento

Este documento describe la **lectura de perfil público** en Next.js. La edición autenticada de privacidad y estado se implementó después y está documentada en `migration/inventory/03-cuenta-privacidad-estado.md`:

- resolución del perfil por `username`;
- lectura server-side de identidad pública y estado visible;
- privacidad legacy para propietario, usuario registrado y visitante anónimo;
- respuestas diferenciadas para perfil inexistente y perfil privado;
- ruta moderna `/profile/[username]`;
- sin exponer email, hash de contraseña, tokens, sesiones ni campos de autorización.

Quedan fuera de este incremento de lectura y del incremento autenticado actual: campos dinámicos de `se_profilevalues`, categorías, fotografías/uploads, amistades, bloqueos, comentarios, visitas, presencia real, estilos personalizados, subredes y plugins/apps.

## Evidencia legacy

| Comportamiento | Fuente observada |
|---|---|
| `profile.php` recibe `user` o `user_id` y crea `$owner` | `docs/legacy/header.php` |
| Perfil inexistente muestra página de error | `docs/legacy/profile.php` |
| Privacidad se calcula como `$privacy_max & $owner->user_info['user_privacy']` | `docs/legacy/profile.php` |
| `user_privacy_max`: owner `1`, friend `2`, friend-of-friend `4`, subred `8`, registrado `16`, anónimo `32` | `docs/legacy/include/class_user.php::user_privacy_max()` |
| Valores de perfil se cargan desde `se_profilevalues` | `docs/legacy/include/class_user.php::getProfileValues()` |
| Nombre mostrado se deriva de la identidad del usuario | `docs/legacy/include/class_user.php::user_displayname()` |
| Foto se resuelve desde el directorio del usuario | `docs/legacy/include/class_user.php::user_photo()` |
| Privacidad configurable y blocklist se guardan en `se_users` | `docs/legacy/user_account_privacy.php` |

## Contrato funcional

### Actores

- **Visitante anónimo:** puede solicitar un perfil cuya máscara incluye `32` (anonymous/everyone). No puede consultar perfiles restringidos a registrados.
- **Usuario autenticado:** puede solicitar un perfil cuya máscara incluye `16` (registered) o `32`. En este incremento no se modelan amistades, subredes ni bloqueos, por lo que solo se evalúan los bits `16` y `32` salvo para el propietario.
- **Propietario:** puede consultar siempre su propio perfil, como en el caso `owner=1` del legacy.
- **Administración:** fuera de alcance; no se concede acceso administrativo implícito.

### Entrada

- `GET /profile/[username]`.
- `username` debe ser un identificador alfanumérico ya validado por el contrato de acceso.
- La sesión se obtiene exclusivamente desde la cookie HTTP-only server-side.

### Salida visible

Perfil público:

```text
{
  username,
  displayName,
  status,
  verified,
  memberSince,
  visibility: "public"
}
```

No se devuelve `email`, `passwordHash`, tokens, sesiones, flags internos ni datos de la base sin mapear.

Perfil privado:

- HTTP 200 con estado de acceso insuficiente y mensaje genérico.
- No se renderizan los campos del propietario.
- No se revela si la restricción procede de nivel, amistad, subred o bloqueo.

Perfil inexistente:

- HTTP 404 mediante `notFound()`.
- No se diferencia entre username inexistente y usuario deshabilitado para evitar enumeración innecesaria.

### Reglas de privacidad

Se conserva la máscara legacy para los niveles implementados:

| Contexto del lector | `privacyMax` | Puede ver privacidad |
|---|---:|---|
| propietario | `1` | siempre |
| usuario autenticado no propietario | `16` | `16` y `32` |
| visitante anónimo | `32` | `32` |

La decisión equivalente es `privacyMax & owner.profilePrivacy !== 0`, con excepción explícita del propietario. Los valores almacenados son máscaras acumulativas legacy: `{0, 1, 3, 7, 15, 31, 63}` (`user_privacy_levels()` en `functions_general.php`). El primer incremento usa `63` como valor público por defecto y no añade una pantalla de edición.

### Efectos secundarios

- Ninguno en este incremento: no se registran visitas ni actividad porque `se_profileviews`, presencia, acciones y notificaciones todavía no tienen modelos destino.
- La lectura no cambia sesión ni crea cookies.
- No se toca la base legacy ni se envían notificaciones.

## Mapa legacy → destino

| Legacy | Next.js | Destino | Estado |
|---|---|---|---|
| `profile.php?user=<username>` | `/profile/<username>` | `User` + caso de lectura de perfil | Este incremento |
| `header.php` `$owner = new SEUser(...)` | `getPublicProfile(username, viewer)` | `packages/domain/src/profile.ts` + `src/server/profile/service.ts` | Este incremento |
| `se_users.user_privacy` | `users.profile_privacy` | Prisma `User.profilePrivacy` | Este incremento |
| `user_account_privacy.php` (`user_privacy`) | `/account/profile` | `updateProfileSettingsAction` | Implementado en `03-cuenta-privacidad-estado.md` |
| `misc_js.php?task=status_change` | `/account/profile` | `users.status` | Implementado sin acción social |
| `se_users.user_status` | `users.status` | Prisma `User.status` | Este incremento |
| `se_users.user_verified`/estado equivalente | `users.verified_at` | Prisma `User.verifiedAt` | Reutilizado |
| `se_profilevalues` | — | Sin migrar todavía | Pendiente |
| `se_profileviews` | — | Sin migrar todavía | Pendiente |
| `se_friends`, blocklist, `se_subnets` | — | Sin migrar todavía | Pendiente |
| `se_users.user_photo` + directorio | — | Sin migrar todavía | Pendiente |

## Seguridad y límites

- Prisma solo se usa en el servicio server-side; los componentes no reciben el cliente ni consultan la base.
- La autorización de privacidad se calcula en servidor y no depende de controles visuales.
- El DTO se construye con una selección explícita de campos.
- Username no se interpola en SQL; Prisma parametriza la búsqueda.
- Se normaliza el username a minúsculas para conservar la resolución case-insensitive observada en `SEUser`.

## Casos límite y pendientes

1. Sin esquema MySQL real no se puede confirmar la codificación efectiva de `user_privacy`, `user_status` o `user_verified`; el destino documenta el contrato observado, no una importación de datos.
2. Los perfiles con privacidad de amistad, amigo de amigo o subred se muestran privados para lectores no propietarios hasta migrar esas relaciones.
3. No se muestran campos dinámicos porque sus nombres, tipos, opciones, privacidad y serialización dependen de `se_profilecats`, `se_profilefields` y `se_profilevalues`.
4. `verifiedAt` se usa como indicador de cuenta verificada; la diferencia frente a `user_verified` debe reconciliarse durante la importación.
5. La paridad de HTML/Smarty, campos dinámicos, fotos, plugins, acciones, comentarios y visitas no está cerrada por estos incrementos.

## Verificación prevista

- `pnpm db:validate`, `pnpm db:status`, lint, TypeScript y build.
- Smoke sintético con perfiles de privacidad `1`, `31` y `63`, comprobando propietario, usuario autenticado, visitante y perfil inexistente.
- Smoke HTTP de `/profile/<username>` y de un username inexistente.
- No se deben dejar usuarios sintéticos en PostgreSQL después de la prueba.
