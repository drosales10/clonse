# Incremento 24 — Eliminación de cuenta autenticada

## Evidencia legacy y alcance

`docs/legacy/user_account_delete.php` exige el permiso de nivel `level_profile_delete`, genera un `delete_token` de sesión con expiración de 300 segundos y acepta `task=dodelete`. Si el token es válido, ejecuta `$user->user_delete()`, renueva cookies y devuelve JSON con el resultado.

Destino: una sección de peligro en `/account/profile`, protegida por sesión y contraseña actual. No se modifica PHP/MySQL ni se ejecuta contra la base legacy.

## Contrato destino

Entrada server-side:

- contraseña actual;
- confirmación literal `ELIMINAR`.

La acción obtiene el usuario exclusivamente de la sesión HTTP-only. No acepta `userId`, username ni IDs de relaciones desde el cliente. La contraseña se verifica contra el hash scrypt antes de cualquier borrado.

## Autorización y efectos secundarios

- Sesión ausente: no hay mutación y se devuelve error genérico.
- Cuenta inexistente, deshabilitada o no verificada: no hay mutación.
- Contraseña incorrecta o confirmación distinta: no hay mutación.
- Con credenciales y confirmación válidas, `deleteUserAccount` elimina el `User` en una transacción Prisma.
- Las relaciones destino con `onDelete: Cascade` eliminan sesiones, campos de perfil, amistades, bloqueos, actividad, comentarios, visitas y notificaciones asociadas.
- Después del commit se elimina la cookie de sesión y se redirige a `/`.

## Trazabilidad

| Legacy | Destino | Diferencia |
|---|---|---|
| `level_profile_delete` | sesión autenticada + credencial actual | no existe aún catálogo efectivo de niveles; se exige una verificación fuerte equivalente de cuenta |
| `delete_token` de 300 segundos | confirmación `ELIMINAR` y contraseña actual | el destino evita estado temporal adicional y usa doble confirmación server-side |
| `$user->user_delete()` | `db.user.delete` transaccional | cascadas Prisma explícitas para relaciones modeladas |
| `user_setcookies()` | `destroySession()` | elimina la sesión HTTP-only moderna |

## Diferencias y límites

- No se puede afirmar que todas las tablas/plugin legacy queden eliminadas porque no existe dump MySQL ni catálogo efectivo de plugins; el destino solo borra relaciones Prisma modeladas.
- No se introduce una autorización de moderación o administración.
- La operación es irreversible en el destino; no se ejecutará ningún smoke destructivo contra datos reales.
- No se almacenan contraseñas, tokens ni datos reales en fixtures o logs.

## Smoke posterior

Con usuario sintético y limpieza controlada, verificar: confirmación inválida no muta; contraseña incorrecta no muta; sesión ausente no muta; confirmación válida elimina usuario y relaciones destino, invalida la sesión y redirige a `/`. La batería completa se mantiene para la fase posterior.
