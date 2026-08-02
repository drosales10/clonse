# Incremento — Catálogo de álbumes y encuestas (polls)

## Estado

Primer corte de lectura pública para álbumes y encuestas, más voto autenticado en polls. Guiado por `docs/legacy` (`browse_albums.php`, `album.php`, `browse_polls.php`, `poll.php`, `poll_ajax.php`, apps `site_albums` / `site_polls`) y el plan de inventarios.

No se modifica PHP/MySQL ni `docs/legacy`. No se importan dumps ni PII.

## Alcance

### Álbumes
- Catálogo `/albums` y detalle `/albums/[albumId]`
- Crear álbum (`/albums/new`) y upload de imágenes (owner)
- Servir binarios autorizados: `GET /api/albums/[albumId]/media/[mediaId]`
- Storage local `storage/albums` (o `ALBUM_STORAGE_DIR`); columnas `storage_key` / `mime_type`
- API `GET /api/albums`, `GET /api/albums/[albumId]`
- Admin: `/admin/albums` (visibilidad catálogo)

Fuera de alcance: importar `uploads_user` legacy, comentarios, tags, edición/borrado de media.

### Encuestas (polls, no “pools”)
- Catálogo `/polls` y detalle `/polls/[pollId]`
- Crear/cerrar (cliente) y cerrar/visibilidad (admin)
- API `GET /api/polls`, `GET /api/polls/[pollId]`
- Voto autenticado (`votePollAction`) equivalente a `task=votepoll`
- Opciones en JSON; votos en tabla `poll_votes` (un voto por usuario)

Fuera de alcance: comentarios, userpoints, serialize PHP.

## Persistencia

Migración `20260803100000_album_poll_catalog`:

- `Album`, `AlbumMedia`
- `Poll`, `PollVote`

Migración `20260804100000_album_media_storage`:

- `album_media.mime_type`, `album_media.storage_key`

Bootstrap local idempotente:

```bash
pnpm migration:album-poll:bootstrap
```

## Rutas

| UI | API |
|---|---|
| `/albums` | `/api/albums` |
| `/albums/new` | — |
| `/albums/[albumId]` | `/api/albums/[albumId]` |
| — | `/api/albums/[albumId]/media/[mediaId]` |
| `/admin/albums` | — |
| `/polls` | `/api/polls` |
| `/polls/new` | — |
| `/polls/[pollId]` | `/api/polls/[pollId]` |
| `/admin/polls` | — |

## Dominio y servicios

- `packages/domain/src/albums.ts`
- `packages/domain/src/polls.ts`
- `src/server/albums/service.ts` / `storage.ts`
- `src/server/polls/service.ts`
- `src/app/actions/albums.ts`
- `src/app/actions/polls.ts`
