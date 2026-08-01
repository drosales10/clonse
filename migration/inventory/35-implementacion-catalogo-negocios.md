# Incremento 35 — Implementación nativa del catálogo de negocios

## Resultado

El catálogo público de negocios ya tiene una implementación nativa en Next.js/React/TypeScript/PostgreSQL/Prisma. No depende de que `docs/bussiness` se instale o se ejecute como plugin PHP. El código legacy y sus datos permanecen intactos.

La implementación parte del contrato documentado en `migration/inventory/26-catalogo-publico-negocios-esquema.md` y cubre únicamente lectura pública/autorizada del catálogo.

## Archivos implementados

| Capa | Archivo | Responsabilidad |
|---|---|---|
| Dominio | `packages/domain/src/businesses.ts` | Tipos, tamaño de página, sort permitido, normalización, disponibilidad y privacidad básica |
| Persistencia | `packages/db/schema.prisma` | `BusinessCategory`, `Business` y relación de ownership con `User` |
| Migración | `packages/db/prisma/migrations/20260802100000_business_catalog/migration.sql` | Tablas, índices, relaciones y defaults nativos; no toca legacy |
| Servicio | `src/server/businesses/service.ts` | Consulta Prisma server-side, categorías descendientes, filtros, ACL y DTO público |
| UI | `src/app/businesses/page.tsx` | Página pública `/businesses`, filtros, categorías, resultados, estados vacío y paginación |
| API | `src/app/api/businesses/route.ts` | `GET /api/businesses` con query validada y sesión opcional |
| Estilos | `src/app/globals.css` | Formulario, chips, tarjetas, metadatos y responsive del catálogo |

## Modelo nativo implementado

### `BusinessCategory`

- ID interno string.
- `legacyId` opcional para trazabilidad.
- Jerarquía `parentId`/`children`.
- Título, orden y estado activo.
- Índices por jerarquía/orden y estado/orden.

### `Business`

- ID interno string y `legacyId` opcional.
- Ownership obligatorio mediante `ownerId -> User.id`.
- Categoría opcional mediante `categoryId`.
- Título, slug, resumen y descripción.
- Ubicación textual no geocodificada.
- Fechas de creación, actualización, aprobación y expiración.
- Flags `searchable`, `featured` y `sponsored`.
- Máscara `privacy` conservada como entero.
- Caches de rating, vistas y comentarios.
- `onDelete: Restrict` para el propietario y `SetNull` para la categoría.

La migración es expand-only y no inserta negocios, categorías, usuarios ni datos reales.

## Contrato implementado

### Entrada

`GET /businesses` y `GET /api/businesses` aceptan:

- `page`: entero positivo, normalizado y limitado.
- `search`: texto de hasta 100 caracteres.
- `categoryId`: ID interno de categoría opcional.
- `sort`: `created`, `updated`, `rating`, `views` o `comments`.

La sesión es opcional y se obtiene server-side desde la cookie existente. El cliente no puede enviar un contexto de permisos.

### Filtros server-side

1. `searchable = true`.
2. `approvedAt IS NOT NULL`.
3. `expiresAt IS NULL OR expiresAt > now`.
4. El propietario está habilitado.
5. La categoría coincide; una categoría raíz incluye descendientes y una subcategoría solo ella misma.
6. La búsqueda se aplica sobre título, resumen, slug, ciudad, provincia y país.
7. Se ordena primero por patrocinado/destacado y después por el orden solicitado.
8. La máscara de privacidad se evalúa después de cargar candidatos y antes de paginar.

### Salida

El DTO público no incluye descripción HTML, pagos, claims, campos dinámicos, uploads, emails, ACL cruda ni datos internos del propietario. Expone título, resumen, ubicación textual, categoría, propietario público, flags, contadores y fechas permitidas.

La página contempla:

- resultados;
- estado vacío;
- búsqueda;
- orden;
- filtro de categorías raíz;
- paginación;
- navegación a perfil del propietario;
- visitante anónimo y usuario autenticado.

## Diferencias deliberadas y límites

- La privacidad implementada resuelve propietario, usuario registrado y visitante anónimo mediante la máscara conservada. Amistades, segundo grado y subred quedan bloqueados hasta que existan los catálogos de relaciones definidos en el incremento 34.
- No hay alta, edición, eliminación, detalle individual ni administración de negocios.
- No se implementan categorías dinámicas, campos configurables ni títulos traducidos desde `se_language*`.
- No se implementan fotos, álbumes, comentarios, ratings mutables, mapas, geocodificación, claims ni pagos.
- La búsqueda usa campos estructurados y `contains` parametrizado por Prisma; no afirma equivalencia FULLTEXT MySQL.
- Los filtros de privacidad se evalúan en memoria después de la consulta base porque todavía no existe una política SQL común para las máscaras legacy. Esto es adecuado para el primer incremento con datos nativos pequeños, pero requiere una estrategia indexable antes de una carga grande.
- La migración conserva `legacyId`, pero no importa ninguna fila legacy.

## Validación

Pasaron correctamente:

- `pnpm prisma validate`;
- `pnpm prisma generate`;
- `pnpm exec tsc --noEmit`;
- lint focalizado de los archivos nuevos;
- `pnpm build`;
- `pnpm prisma migrate deploy`;
- `pnpm prisma migrate status`;
- `git diff --check`.

La migración local aplicada es `20260802100000_business_catalog`; la base PostgreSQL local quedó sincronizada y sin filas de negocio creadas por este incremento.

El lint global continúa fallando por código JavaScript legacy incluido dentro de `docs/Forums/include/forum/fckeditor` y `docs/bussiness/include/js`. Esos errores no proceden de los archivos nuevos y no se modificaron para ocultarlos.

## Incidencia del historial Prisma

`pnpm prisma migrate dev --name business_catalog --create-only` no pudo generar automáticamente la migración porque el shadow database detecta que la migración histórica `20260801162125_profile_comment_notifications` referencia `profile_comments` antes de que el historial la cree. El estado de la base local sí era consistente y `pnpm prisma migrate status` estaba actualizado.

Se creó manualmente una migración pequeña y revisable para las dos tablas nuevas, se validó el schema y se aplicó con `pnpm prisma migrate deploy`. La discrepancia del historial shadow queda pendiente de corregir en una revisión separada; no se reescribieron migraciones aplicadas.

## Pendientes para cerrar paridad

1. Confirmar esquema/configuración efectiva de negocios sin copiar PII.
2. Crear `UserIdentityMap` antes de importar ownership legacy.
3. Confirmar niveles, subredes, amistades y categorías de perfil.
4. Añadir pruebas de contrato con fixtures sintéticos para privacidad, aprobación, expiración, categoría y paginación.
5. Diseñar detalle y mutaciones como casos de uso separados y transaccionales.
6. Añadir adaptadores reales para storage, mapas, correo, ratings y pagos cuando corresponda.
7. Resolver títulos de categorías/tipos mediante un catálogo de idiomas seguro.
8. Definir una búsqueda PostgreSQL equivalente antes de grandes volúmenes.

## Decisión

El núcleo del catálogo de negocios ya está construido como funcionalidad nativa del gemelo digital. No se esperará la instalación o ejecución del plugin PHP para continuar con los siguientes dominios que tengan evidencia suficiente. Las capacidades no confirmadas se mantienen como adaptadores o pendientes explícitos, no como bloqueos del núcleo ni como funcionalidades inventadas.
