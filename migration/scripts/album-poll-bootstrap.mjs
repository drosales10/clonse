import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

/**
 * Idempotent demo catalog for albums + polls.
 * Safe local data only — no legacy dumps or PII.
 */

function normalizeDatabaseUrl(rawValue) {
  const raw = String(rawValue ?? "")
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/^postgresql\+asyncpg:/i, "postgresql:");
  if (!raw) throw new Error("DATABASE_URL is required");
  return new URL(raw).toString();
}

const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);
const pool = new Pool({ connectionString: databaseUrl, max: 1 });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });

const now = new Date();

try {
  const owner = await db.user.findFirst({
    where: { enabled: true, verifiedAt: { not: null } },
    orderBy: { createdAt: "asc" },
    select: { id: true, username: true },
  });
  if (!owner) throw new Error("Need at least one enabled verified user");

  const album = await db.album.upsert({
    where: { legacyId: -101 },
    create: {
      legacyId: -101,
      ownerId: owner.id,
      title: "Momentos de la red",
      description: "Álbum de demostración del catálogo público. Sin binarios en este corte.",
      createdAt: now,
      updatedAt: now,
      searchable: true,
      catalogVisible: true,
      privacy: 63,
      views: 12,
      totalFiles: 3,
      sortOrder: 1,
      media: {
        create: [
          {
            legacyId: -1001,
            title: "Amanecer",
            description: "Metadato de ejemplo",
            extension: "jpg",
            filesize: 245760,
            sortOrder: 0,
          },
          {
            legacyId: -1002,
            title: "Encuentro",
            extension: "jpg",
            filesize: 312000,
            sortOrder: 1,
          },
          {
            legacyId: -1003,
            title: "Nota rápida",
            extension: "png",
            filesize: 88000,
            sortOrder: 2,
          },
        ],
      },
    },
    update: {
      ownerId: owner.id,
      title: "Momentos de la red",
      description: "Álbum de demostración del catálogo público. Sin binarios en este corte.",
      searchable: true,
      catalogVisible: true,
      privacy: 63,
      totalFiles: 3,
      updatedAt: now,
    },
    select: { id: true },
  });

  // Ensure media exists even on update path
  const mediaCount = await db.albumMedia.count({ where: { albumId: album.id } });
  if (mediaCount === 0) {
    await db.albumMedia.createMany({
      data: [
        {
          legacyId: -1001,
          albumId: album.id,
          title: "Amanecer",
          description: "Metadato de ejemplo",
          extension: "jpg",
          filesize: 245760,
          sortOrder: 0,
        },
        {
          legacyId: -1002,
          albumId: album.id,
          title: "Encuentro",
          extension: "jpg",
          filesize: 312000,
          sortOrder: 1,
        },
        {
          legacyId: -1003,
          albumId: album.id,
          title: "Nota rápida",
          extension: "png",
          filesize: 88000,
          sortOrder: 2,
        },
      ],
      skipDuplicates: true,
    });
  }

  await db.poll.upsert({
    where: { legacyId: -201 },
    create: {
      legacyId: -201,
      ownerId: owner.id,
      title: "¿Qué función quieres ver primero?",
      description: "Encuesta de demostración. Un voto por cuenta autenticada.",
      options: ["Mensajes privados", "Fotos reales", "Chat en vivo", "Más grupos"],
      createdAt: now,
      searchable: true,
      catalogVisible: true,
      privacy: 63,
      closed: false,
      totalVotes: 0,
      views: 8,
    },
    update: {
      ownerId: owner.id,
      title: "¿Qué función quieres ver primero?",
      description: "Encuesta de demostración. Un voto por cuenta autenticada.",
      options: ["Mensajes privados", "Fotos reales", "Chat en vivo", "Más grupos"],
      searchable: true,
      catalogVisible: true,
      privacy: 63,
      closed: false,
    },
    select: { id: true },
  });

  await db.poll.upsert({
    where: { legacyId: -202 },
    create: {
      legacyId: -202,
      ownerId: owner.id,
      title: "Preferencia de temas",
      description: "Ejemplo cerrado para mostrar resultados.",
      options: ["Claro", "Oscuro", "Automático"],
      createdAt: new Date(now.getTime() - 86_400_000),
      searchable: true,
      catalogVisible: true,
      privacy: 63,
      closed: true,
      totalVotes: 0,
      views: 21,
    },
    update: {
      ownerId: owner.id,
      title: "Preferencia de temas",
      searchable: true,
      catalogVisible: true,
      closed: true,
    },
    select: { id: true },
  });

  const albums = await db.album.count({ where: { catalogVisible: true } });
  const polls = await db.poll.count({ where: { catalogVisible: true } });
  console.log(`album-poll-bootstrap ok owner=${owner.username} albumsVisible=${albums} pollsVisible=${polls}`);
} finally {
  await db.$disconnect();
  await pool.end();
}
