import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

import { normalizeDatabaseUrl } from "@/../packages/db/src/database-url";

/** Bump when Prisma schema fields change so HMR does not keep a stale client. */
const PRISMA_SCHEMA_EPOCH = "20260804110000_event_catalog_visible";

const globalForDatabase = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaSchemaEpoch?: string;
  pool?: Pool;
};

function databaseUrl(): string {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL is required to access PostgreSQL.");
  return normalizeDatabaseUrl(value);
}

const pool =
  globalForDatabase.pool ??
  new Pool({
    connectionString: databaseUrl(),
    max: 10,
  });

const adapter = new PrismaPg(pool);

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

if (
  process.env.NODE_ENV !== "production" &&
  globalForDatabase.prisma &&
  globalForDatabase.prismaSchemaEpoch !== PRISMA_SCHEMA_EPOCH
) {
  void globalForDatabase.prisma.$disconnect().catch(() => undefined);
  globalForDatabase.prisma = undefined;
}

export const db = globalForDatabase.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.pool = pool;
  globalForDatabase.prisma = db;
  globalForDatabase.prismaSchemaEpoch = PRISMA_SCHEMA_EPOCH;
}
