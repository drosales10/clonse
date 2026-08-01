# Incremento 34 — Estrategia transversal de usuarios, IDs y ACL

## Decisión ejecutiva

La migración usará tres identificadores conceptualmente distintos:

1. **ID interno PostgreSQL/Prisma**: `User.id` (`String`, actualmente `cuid()`), usado por todas las relaciones del gemelo.
2. **ID legacy SocialEngine**: `se_users.user_id` entero, conservado mediante una correspondencia explícita y nunca sustituido silenciosamente.
3. **Identificadores públicos**: username, slug o ID opaco según cada superficie; no se usan como clave de integridad ni como autorización.

No se usará email, username, display name ni hash de contraseña para enlazar usuarios. El `user_id` legacy es la autoridad de identidad de la fuente; el `User.id` es la autoridad de relaciones en PostgreSQL.

La autorización se evaluará con un **contexto de viewer** server-side y políticas por dominio. Se reutilizará infraestructura común para resolver usuario, sesión, bloqueos, amistad, nivel, subred y categoría de perfil, pero no se unificarán por suposición las máscaras numéricas de privacidad: el mismo número puede tener significados distintos en perfil, negocios, eventos, grupos y foro.

Este documento cierra la estrategia conceptual. No modifica `packages/db/schema.prisma`, no crea migraciones y no importa datos.

## Evidencia y estado actual

Fuentes revisadas:

- `packages/db/schema.prisma`;
- `migration/inventory/01-acceso-identidad.md`;
- `migration/inventory/02-perfil-cuenta.md`;
- `migration/inventory/03-cuenta-privacidad-estado.md`;
- `migration/inventory/04-campos-dinamicos-perfil.md`;
- `migration/inventory/26-catalogo-publico-negocios-esquema.md`;
- `migration/inventory/28-clasificados-esquema-y-catalogo.md`;
- `migration/inventory/29-eventos-esquema-y-catalogo.md`;
- `migration/inventory/30-grupos-foros-esquema-y-catalogo.md`;
- `migration/inventory/33-foro-contrato-lectura-y-paridad.md`;
- `docs/01-arquitectura.md` y `docs/02-funcionalidades-usuario.md`.

El schema actual ya contiene:

- `User.id` interno string;
- `username` y `email` únicos;
- `profilePrivacy` y `commentsPrivacy` como enteros;
- `FriendConnection` direccional con `status` string;
- `ProfileBlock` direccional;
- `ProfileCategory.legacyId` y `ProfileField.legacyId` opcionales.

Todavía no contiene un modelo de correspondencia de usuarios legacy, catálogo de niveles, subredes, relación de categorías de perfil legacy, ni un servicio común de autorización. La vertical de perfil solo implementa propietario/registrado/anónimo y deja amistades, bloqueos y subredes pendientes.

## 1. Estrategia de IDs

### 1.1 Autoridad y uso

| Identificador | Autoridad | Uso permitido | Uso prohibido |
|---|---|---|---|
| `User.id` | PostgreSQL | FK, sesiones, ownership y relaciones destino | Intentar inferirlo desde un entero legacy |
| `legacy user_id` | MySQL SocialEngine | Importación, trazabilidad, reconciliación y compatibilidad | Exponerlo como secreto o usarlo sin verificar source |
| `username` | Legacy/destino según política de cuenta | Resolución pública y navegación | Clave de FK, unión masiva o autorización |
| `email` | Cuenta | Login, contacto según privacidad | Correspondencia automática de identidades |
| ID de entidad legacy | Tabla legacy correspondiente | `legacyId` de la entidad migrada | Tratarlo como ID global entre módulos |
| slug/URL pública | Aplicación | Navegación y SEO | Identidad persistente de migración |

Los IDs enteros de módulos son locales a su tabla: `business_id=10`, `event_id=10` y `group_id=10` pueden representar objetos distintos. Cada entidad destino debe tener su propio `legacyId` o una clave de correspondencia con `sourceTable`/`sourceSystem`.

### 1.2 Correspondencia de usuarios

El modelo lógico recomendado para la siguiente revisión de Prisma es:

```text
UserIdentityMap
- id: ID interno
- userId: FK a User
- sourceSystem: "socialengine-3"
- sourceTable: "se_users"
- legacyUserId: entero positivo
- status: active | unresolved | merged | excluded
- importedAt / updatedAt
- reasonCode opcional

UNIQUE(sourceSystem, sourceTable, legacyUserId)
UNIQUE(userId, sourceSystem, sourceTable)
```

Si el proyecto confirma que solo existirá una fuente SocialEngine, `User.legacyId` puede ser una simplificación posterior. La decisión actual favorece `UserIdentityMap` porque:

- permite fuentes o reimportaciones diferenciadas;
- evita acoplar el ID de una fuente a la clave principal moderna;
- permite marcar usuarios excluidos, fusionados o no resolubles;
- facilita auditoría y reconciliación sin modificar relaciones internas;
- no obliga a que usuarios nuevos tengan un ID legacy.

El `legacyUserId` debe ser `NOT NULL` solo dentro de una fila de correspondencia confirmada. No se deben crear filas sintéticas con `0`, porque varias tablas legacy usan `0` como default y no como usuario válido.

### 1.3 Algoritmo de resolución

Para resolver una referencia `legacyUserId` durante una transformación:

1. Validar que el valor sea entero positivo; `0`, vacío y negativos se clasifican como referencia ausente/defectuosa.
2. Buscar por `(sourceSystem, sourceTable, legacyUserId)` en la tabla de correspondencia.
3. Exigir que el mapping esté `active` para crear una FK funcional.
4. Si está `merged`, seguir únicamente un `canonicalUserId` documentado; no elegir por email o username.
5. Si está `unresolved` o `excluded`, no crear una relación pública silenciosa: registrar incidencia agregada y aplicar la política del dominio.
6. Si no existe mapping, clasificar como `missing-user-reference` y detener la importación de la fila dependiente o enviarla a cuarentena.
7. Nunca resolver por email, username, display name o coincidencia aproximada.

Una transformación debe ser idempotente: repetirla para el mismo mapping no crea otro usuario ni cambia el ID interno.

### 1.4 Usuarios nuevos y compatibilidad

Los usuarios creados directamente en Next.js tendrán `User.id` interno y no tendrán `legacyUserId`, salvo que una operación explícita de vinculación haya sido validada. El username puede conservarse como dato de cuenta, pero la resolución de relaciones siempre debe usar el ID interno en el destino.

Las entidades migradas conservarán:

- `id` interno Prisma;
- `legacyId` de su tabla cuando esté confirmado;
- `sourceSystem` o trazabilidad equivalente si puede haber más de una fuente.

No se publicarán automáticamente IDs legacy en URLs nuevas. Si una ruta de compatibilidad los acepta, debe validar tipo, existencia, pertenencia al dominio y autorización.

### 1.5 Colisiones y merges

- Colisión de `legacyUserId` dentro de la misma fuente: error bloqueante de reconciliación.
- Dos mappings activos hacia el mismo usuario para la misma fuente: error bloqueante.
- Dos usuarios destino candidatos al mismo legacy: no resolver automáticamente.
- Usuario legacy fusionado: conservar la fila histórica y apuntar a un usuario canónico mediante una transición explícita.
- Username cambiado: no altera el mapping.
- Email cambiado: no altera el mapping.
- Cuenta deshabilitada: el mapping puede permanecer para trazabilidad, pero la política de lectura debe evaluar `enabled`/estado de cuenta.

## 2. Fechas, referencias y valores especiales

La estrategia de identidad requiere preservar también la semántica de las referencias:

- timestamps Unix legacy se convierten a `DateTime` UTC solo después de distinguir `0` como ausencia cuando el dominio así lo documenta;
- `datetime` del foro se convierte con la zona horaria documentada de la fuente;
- `0` en una FK no se convierte en usuario/categoría con ID `0`;
- booleanos codificados se validan antes de convertirlos a `Boolean`;
- caches de nombre, foto y display name no sustituyen la relación a `User`;
- si el usuario no se resuelve, el cache textual no autoriza a presentarlo como usuario válido;
- PII, emails, tokens, hashes y uploads nunca entran en fixtures o informes.

## 3. Contexto transversal de viewer

Los casos de uso de lectura recibirán un contexto obtenido server-side, conceptualmente:

```ts
interface ViewerContext {
  kind: "anonymous" | "user" | "admin";
  userId: string | null;
  legacyUserId: number | null;
  levelId: string | null;
  legacyLevelId: number | null;
  subnetId: string | null;
  legacySubnetId: number | null;
  profileCategoryId: string | null;
  legacyProfileCategoryId: number | null;
  enabled: boolean;
  verified: boolean;
}
```

El contexto no se acepta desde query, body, headers controlables por el cliente ni campos ocultos. Se deriva de la sesión, del usuario destino y de repositorios autorizados. `admin` es una superficie distinta y no debe obtenerse cambiando `kind` desde la UI.

El contexto puede enriquecerse con relaciones calculadas:

```text
RelationshipContext
- isOwner
- isFriend
- isFriendOfFriend
- isMember
- hasPendingMembership
- isModerator
- isBlockedByOwner
- hasBlockedOwner
- sameSubnet
- sameProfileCategory
```

Estas propiedades deben calcularse para el par viewer/owner o viewer/member y deben tener una fuente y estado documentados. Si una relación no está migrada, no se debe simular como positiva.

## 4. ACL y privacidad

### 4.1 Separación de conceptos

No se mezclan estas decisiones:

1. **Acceso al módulo**: configuración global y permiso de nivel, por ejemplo `setting_permission_business` o `level_*_allow`.
2. **Visibilidad del objeto**: máscara de privacidad del negocio, evento, grupo, perfil u otro objeto.
3. **Relación contextual**: propietario, amistad, miembro, invitado, segundo grado o subred.
4. **Permiso de acción**: comentar, escribir, subir, invitar, editar, borrar, valorar.
5. **Moderación/administración**: scope propio, categoría, instancia o administración.
6. **Estado del objeto**: aprobado, buscable, expirado, bloqueado, eliminado o disponible.

Un objeto puede ser visible pero no escribible. Un moderador puede escribir en una categoría bloqueada aunque un usuario normal no pueda. Un objeto aprobado/buscable puede seguir siendo privado.

### 4.2 Evaluador común y políticas por dominio

La infraestructura puede exponer una interfaz conceptual:

```ts
interface AccessDecision {
  allowed: boolean;
  reason: "owner" | "public" | "registered" | "friend" | "friendOfFriend" |
    "member" | "subnet" | "profileCategory" | "moderator" | "level" |
    "denied" | "moduleDisabled" | "objectUnavailable";
  policyVersion: string;
}

interface AccessPolicy<Input> {
  canRead(input: Input, viewer: ViewerContext): AccessDecision;
  canAct?(input: Input, viewer: ViewerContext, action: string): AccessDecision;
}
```

El evaluador común resuelve relaciones y aplica precedencia; cada dominio proporciona la tabla de bits/estados y las condiciones específicas. No debe existir un `canRead(mask)` universal sin conocer el tipo de objeto.

### 4.3 Precedencia propuesta

La evaluación debe seguir esta secuencia, ajustada por evidencia del dominio:

1. `moduleDisabled`/configuración no disponible: denegar.
2. viewer o cuenta no aptos: denegar, salvo reglas públicas explícitas.
3. objeto inexistente, eliminado, no aprobado o expirado: no disponible según el dominio.
4. bloqueo explícito: denegar, salvo una regla administrativa/migración documentada.
5. propietario: permitir las capacidades que el dominio concede al propietario.
6. moderador de ámbito: permitir las capacidades que el dominio concede a moderadores.
7. relación de miembro/invitado/amistad/subred/categoría de perfil: evaluar máscara y estado del dominio.
8. usuario registrado/anónimo: evaluar bits correspondientes.
9. ausencia de coincidencia: denegar.

La precedencia de bloqueo debe confirmarse contra cada flujo legacy antes de declararla paridad completa. La estrategia moderna adopta deny-by-default para no hacer públicos datos si falta evidencia.

### 4.4 Máscaras: conservar, no universalizar

Las máscaras deben almacenarse temporalmente como enteros o transformarse a asignaciones normalizadas manteniendo `rawMask` para auditoría. No se convierten en enums globales.

Contrato confirmado para perfil:

| Bit | Contexto |
|---:|---|
| `1` | propietario |
| `2` | amigo |
| `4` | amigo de amigo |
| `8` | misma subred |
| `16` | usuario registrado |
| `32` | visitante anónimo |

Para negocios se observa la misma familia general de propietario/registrado/anónimo, amistad, subred y segundo grado, pero sus valores y filtros de aprobación/expiración deben conservar la política de negocio.

Para eventos, los inventarios observan semántica adicional de miembro/invitado y amigos de miembros. Para grupos, la relación de miembro activo tiene reglas propias. Para foro, la lectura no se expresa como una máscara única: combina `public_can_read`, listas de nivel/subred/profilecat y moderadores, con OR entre las listas.

Conclusión: se reutiliza el **contexto** y el **motor de evaluación**, pero cada `AccessPolicy` debe declarar:

- dominio y versión de política;
- bits o listas aceptados;
- relaciones requeridas;
- estado del objeto;
- precedencia de bloqueos/moderación;
- acciones distintas de lectura.

### 4.5 ACL del foro

La política de foro se modela como:

```text
allowRead = isModerator
         OR (guest AND publicCanRead)
         OR (authenticated AND (
              levelId IN readLevelIds
           OR subnetId IN readSubnetIds
           OR profileCategoryId IN readProfileCategoryIds
         ))
```

La escritura no se deriva de lectura: exige autenticación, categoría padre/subcategoría/tema no bloqueados y coincidencia en las listas de escritura, salvo moderador. Moderadores y ACL deben normalizarse antes de usarse como FK/autorización.

### 4.6 ACL de negocios, eventos, grupos y perfil

| Dominio | Identidad principal | Relación adicional | Estado/condición no sustituible |
|---|---|---|---|
| Perfil | `User` propietario | amistad, subred, registrado/anónimo, bloqueos | `profilePrivacy`; campos `displayMode` |
| Negocio | `business_user_id` | amistad, subred, segundo grado | `search=1`, aprobado y no expirado según evidencia |
| Evento | `event_user_id` | miembro/invitado, amistad, segundo grado, subred | máscaras y RSVP/membresía; no inventar expiración |
| Grupo | `group_user_id` | miembro activo, amistad y segundo grado | privacidad, aprobación y estado de membresía |
| Foro | `Post/Category/Instance` y `user_id` | nivel, subred, profilecat, moderador | `public_can_read`, locks y ACL textual legacy |

La tabla resume contratos de lectura, no autoriza a compartir los nombres de campos sin una transformación por dominio.

## 5. Bloqueos, amistad y pertenencia

### 5.1 Bloqueos

`ProfileBlock` actual es direccional. El servicio de relaciones debe devolver al menos:

- `viewerBlocksOwner`;
- `ownerBlocksViewer`;
- `eitherBlocked`, calculado según la política del dominio.

No se debe asumir que una fila en una dirección equivale a ambas. Antes de permitir una lectura relacional, cada dominio debe declarar si cualquiera de las dos direcciones oculta el objeto.

### 5.2 Amistad

`FriendConnection` actual es una relación dirigida con `status` string. La estrategia no asume que todo status distinto de `pending` sea amistad aceptada. Debe existir un catálogo/constante validada, por ejemplo:

```text
pending | accepted | declined | cancelled | blocked | removed
```

La relación `isFriend` será verdadera únicamente para el estado que la instalación y el dominio confirmen como aceptado, y con la orientación correcta. Para segundo grado se requieren dos conexiones aceptadas y no bloqueadas; no se inferirá desde una sola solicitud pendiente.

### 5.3 Membresía

Eventos y grupos tienen tablas de membresía con `status`, `approved`, `rank`, invitación o RSVP. La pertenencia debe representarse como un `MembershipContext` específico, no como amistad:

```text
isMember: boolean
isApproved: boolean
isInvited: boolean
rank: string | number | null
rsvp: string | number | null
```

El foro no usa membresía de grupo para autorizar lectura; sus moderadores/ACL son independientes.

## 6. Propuesta de capas

### `packages/domain`

Debe contener contratos puros y evaluadores sin Prisma ni transporte:

- `ViewerContext`;
- `RelationshipContext`;
- `AccessDecision`;
- `AccessPolicy`;
- políticas de perfil, negocio, evento, grupo y foro;
- validación de estados de amistad/membresía;
- errores de acceso no filtrantes.

### `packages/db`

Debe contener repositorios y modelos para:

- User y sesiones;
- correspondencia `UserIdentityMap`;
- niveles, subredes y categorías de perfil cuando estén confirmados;
- amistades/bloqueos/membresías;
- entidades por dominio y sus `legacyId`;
- consultas de relaciones, sin autorizar por sí solas.

### `app`/servicios server-side

Debe construir el `ViewerContext`, llamar al caso de uso y mapear `AccessDecision` a DTO/HTTP. No debe duplicar consultas Prisma en componentes ni aceptar contexto de viewer del cliente.

### UI

Solo presenta el resultado ya autorizado. No decide si un objeto es público, amigo, aprobado, permitido por nivel o visible por subred.

## 7. Plan de adopción sin migración destructiva

### Fase A — Contrato y mapping

- Crear fixtures sintéticos de usuarios con IDs legacy distintos, username/email cambiados, bloqueos, amistades y estados.
- Definir catálogo de estados de amistad/membresía.
- Definir tabla de correspondencia de usuarios y reporte de duplicados/missing references.
- No cargar PII ni dumps.

### Fase B — Expand

- Añadir `UserIdentityMap` y catálogos de relación mediante migración Prisma expand-only.
- Mantener `User.id` y las tablas actuales.
- Añadir índices para `(sourceSystem, sourceTable, legacyUserId)` y relaciones de lectura.
- No imponer `NOT NULL` sobre columnas históricas hasta completar backfill/reconciliación.

### Fase C — Backfill controlado

- Ejecutar extractor dry-run sobre una copia/autorizada del origen, nunca contra legacy de producción sin aprobación.
- Emitir solo conteos, hashes no reversibles, códigos de error y relaciones agregadas.
- Resolver usuarios antes de entidades dependientes.
- Enviar referencias no resolubles a cuarentena, sin borrar ni alterar origen.

### Fase D — Consumir mapping

- Repositorios de negocio aceptan `legacyId` solo en la frontera de migración/compatibilidad.
- Casos de uso trabajan exclusivamente con IDs internos.
- Las políticas de ACL reciben `ViewerContext` y relaciones internas.
- Ningún Route Handler construye SQL con IDs provenientes del cliente.

### Fase E — Contract/contract posterior

- Después de reconciliar conteos y relaciones, imponer restricciones, `NOT NULL`, `UNIQUE` y FKs revisadas.
- Mantener `legacyId` para trazabilidad durante toda la migración.
- Eliminar tablas de staging solo con autorización y reporte de conservación; nunca borrar legacy para facilitar el destino.

## 8. Matriz de riesgos y controles

| Riesgo | Control obligatorio |
|---|---|
| Unir usuarios por email/username y enlazar cuentas equivocadas | Solo mapping por `se_users.user_id` y fuente confirmada |
| ID `0` convertido en usuario válido | Validación positiva y clasificación de referencia ausente |
| Hacer pública una entidad por ACL incompleta | Deny-by-default y política versionada por dominio |
| Usar una máscara de negocio en eventos/grupos/perfil | Política específica; conservar `rawMask` |
| Tratar cache de display name como identidad | FK a `User` más cache opcional no autoritativo |
| Confundir solicitud de amistad con amistad | Estados catalogados y prueba de orientación |
| Confundir miembro/invitado con amigo | `MembershipContext` separado |
| Bloqueo unidireccional omitido | Evaluar ambas direcciones según política del dominio |
| Foreign key impuesta antes de resolver huérfanos | Expand → backfill → contract y cuarentena |
| PII en logs/fixtures | Conteos/códigos agregados, sin filas, emails ni contenido |
| Admin mezclado con usuario | Sesión/guard independiente para administración |
| Repetición de importación duplica usuarios | Unique por fuente + mapping idempotente |

## 9. Criterios de cierre

La estrategia transversal se considerará lista para modelado cuando:

1. cada usuario legacy elegible tenga como máximo un mapping activo por fuente;
2. usuarios nuevos puedan existir sin ID legacy;
3. ninguna relación de dominio dependa de username/email/display name;
4. las entidades de negocios, eventos, grupos y foro tengan `legacyId` local y FK interna separada;
5. `ViewerContext` se construya server-side desde sesión y repositorios;
6. amistad, bloqueo, membresía, nivel, subred y categoría de perfil tengan estados y fuentes confirmadas;
7. cada política de privacidad declare su propia semántica de máscara/listas;
8. los recursos no visibles no filtren existencia cuando el dominio exige privacidad;
9. no existan mappings automáticos por similitud ni referencias silenciosamente huérfanas;
10. el plan expand/backfill/contract y la cuarentena estén definidos antes de imponer restricciones.

## 10. Pendientes explícitos

Esta estrategia no afirma que las siguientes piezas estén implementadas:

- tabla Prisma `UserIdentityMap`;
- `UserLevel`, `Subnet` o catálogo efectivo de categorías de perfil legacy;
- importación de usuarios o relaciones;
- confirmación de estados reales de `se_friends` y membresías;
- resolución de títulos de idioma y campos dinámicos;
- políticas completas de bloqueos en cada dominio;
- matriz ejecutable contra una instalación activa;
- migración de datos o creación de modelos de negocio/foro.

El siguiente incremento técnico recomendado es diseñar el contrato de `UserIdentityMap` y los catálogos de relación como una migración expand-only, después de confirmar los `CREATE TABLE` de `se_users`, `se_friends`, `se_subnets`, niveles y categorías de perfil. Hasta entonces, los catálogos 26–33 pueden continuar como contratos e inventarios, pero no deben añadir FKs de usuario ni declarar paridad de privacidad completa.
