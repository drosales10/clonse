# Incremento 10 — Visitas de perfil

## Alcance

Este incremento migra la parte observable de visitas de perfil:

- contar una visita cuando un perfil visible es consultado por otra persona o por un visitante anónimo;
- mantener, cuando la cuenta lo permite, la lista de visitantes registrados recientes;
- mostrar el total públicamente en el perfil visible;
- mostrar al propietario sus visitantes y permitir reiniciar sus estadísticas desde `/home`;
- aplicar privacidad, cuenta activa y bloqueos antes de registrar la visita.

No se registra IP, user-agent, cookie de visitante, ubicación, fecha exacta para el público ni historial anónimo identificable.

## Evidencia legacy

| Comportamiento | Fuente | Observación |
|---|---|---|
| Registro de visita | `docs/legacy/profile.php` | después de superar la privacidad, si el visitante no es el propietario, ejecuta `INSERT ... ON DUPLICATE KEY UPDATE` sobre `se_profileviews` |
| Contador | `docs/legacy/profile.php` | incrementa `profileview_views` en cada consulta visible; las visitas propias no incrementan |
| Visitantes registrados | `docs/legacy/profile.php` | si `user_saveviews` está activo, conserva IDs registrados, elimina el ID repetido y lo vuelve a colocar al frente |
| Lectura pública | `docs/legacy/profile.php` y `templates/profile.tpl` | expone `profile_views` dentro de las estadísticas del perfil |
| Panel del propietario | `docs/legacy/user_home.php` y `templates/user_home.tpl` | lee contador y visitantes, enlaza cada visitante a su perfil y ofrece reinicio |
| Reinicio | `docs/legacy/user_home.php` | `task=resetviews` pone contador a cero y vacía la lista de visitantes del propietario |

`se_profileviews` y sus índices se observan en consultas PHP, pero no existe dump MySQL verificable. La clave exacta y el límite efectivo de la lista no pueden confirmarse.

## Actores, autorización y estados

- **Visitante anónimo:** puede incrementar el contador únicamente si el perfil es visible para anónimos; nunca se identifica en la lista.
- **Usuario autenticado:** incrementa el contador de un perfil visible ajeno y puede aparecer como visitante reciente si el propietario permite guardar visitantes.
- **Propietario:** ve su contador y su lista de visitantes; es el único actor autorizado a reiniciar sus estadísticas y cambiar `saveProfileViews`.
- **Perfil privado:** no genera visita porque la lectura se rechaza antes del registro.
- **Bloqueo en cualquiera de los sentidos:** no genera visita y no expone contador/lista mediante la respuesta privada o bloqueada.
- **Cuenta deshabilitada:** no puede ser propietaria ni visitante válido en la superficie destino.

## Contrato destino

### Perfil público

`PublicProfile.profileViews` devuelve solo un entero no negativo cuando la lectura está autorizada. El registro ocurre server-side después de comprobar usuario activo, bloqueo y privacidad. El propietario no se cuenta a sí mismo.

### Panel autenticado

`getOwnProfileViews` devuelve:

```text
{
  totalViews: number,
  viewers: [{ username: string, displayName: string }]
}
```

La lista se limita a 50 visitantes registrados recientes en el destino. El total incluye visitas anónimas y visitas registradas, igual que el contador legacy. Los visitantes se ordenan por la última consulta registrada; no se expone fecha exacta.

### Mutación

`resetProfileViewsAction` exige sesión válida y usa una transacción para eliminar visitantes y poner el total a cero. El ID del propietario se obtiene de la sesión, nunca del formulario.

## Persistencia y trazabilidad

| Legacy | Destino | Decisión |
|---|---|---|
| `se_profileviews.profileview_user_id` | `profile_view_stats.profile_owner_id` único | una fila agregada por propietario |
| `profileview_views` | `profile_view_stats.total_views` | contador que también cubre anónimos |
| `profileview_viewers` CSV | `profile_view_viewers` | relación normalizada propietario/visitante, sin CSV ni SQL dinámico |
| `se_users.user_saveviews` | `users.save_profile_views` | preferencia separada; valor inicial destino `true` queda pendiente de verificar contra settings efectivos |
| `user_home.php?task=resetviews` | Server Action en `/home` | misma capacidad con autorización server-side |

La relación de visitante tiene clave única por resumen y usuario, por lo que una nueva visita actualiza su posición temporal en lugar de duplicar la fila. La limpieza conserva como máximo los 50 registros recientes.

## Diferencias aceptadas y bloqueos

- No se puede confirmar el esquema, la clave, la collation ni el límite de `se_profileviews` sin dump MySQL.
- El legacy guarda una lista CSV y su orden se reconstruye con IDs; el destino usa una tabla relacional y `viewed_at`, que expresa la intención observable de visitantes recientes sin depender de IDs.
- El legacy no ofrece en la evidencia consultada un timestamp de visita; `viewed_at` es metadato interno del destino y no se muestra públicamente.
- Se usa `save_profile_views=true` por defecto hasta verificar la configuración efectiva. El propietario puede desactivarlo desde ajustes; al desactivarlo no se añaden nuevos visitantes, pero el contador continúa funcionando.
- El destino no migra datos porque no hay dump verificable y no modifica la base legacy.
- Notificaciones, CAPTCHA, moderación, multimedia y paginación de otras verticales permanecen fuera de alcance.

## Criterios de aceptación

1. Perfil público consultado por tercero incrementa una vez el contador de la consulta.
2. Perfil propio no incrementa contador.
3. Perfil privado o bloqueado no incrementa contador ni revela datos.
4. Visitante anónimo incrementa contador, pero no aparece en visitantes.
5. Visitante autenticado aparece como máximo una vez y se actualiza como reciente si el propietario permite guardar visitantes.
6. Terceros no reciben la lista de visitantes.
7. Solo el propietario autenticado puede reiniciar sus estadísticas.
8. Reinicio elimina visitantes y deja el total en cero atómicamente.
9. La preferencia de guardar visitantes no altera el contador total.
10. Las pruebas usan usuarios sintéticos y restauran/eliminan sus filas sin tocar datos reales.
