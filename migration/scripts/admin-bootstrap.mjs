import "dotenv/config";
import { randomBytes, scryptSync } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

function readRequired(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function normalizeDatabaseUrl(rawValue) {
  const raw = rawValue.trim().replace(/^['"]|['"]$/g, "").replace(/^postgresql\+asyncpg:/i, "postgresql:");
  const url = new URL(raw);
  return url.toString();
}

function hashPassword(password) {
  const salt = randomBytes(16);
  const derivedKey = scryptSync(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

const email = readRequired("SEED_ADMIN_EMAIL").toLowerCase();
const password = readRequired("SEED_ADMIN_PASSWORD");
if (!email.includes("@")) throw new Error("SEED_ADMIN_EMAIL must be an email address");

const databaseUrl = normalizeDatabaseUrl(readRequired("DATABASE_URL"));
const pool = new Pool({ connectionString: databaseUrl, max: 1 });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });

try {
  await db.admin.upsert({
    where: { email },
    create: {
      username: email,
      displayName: email.split("@", 1)[0],
      email,
      passwordHash: hashPassword(password),
      passwordMethod: 0,
      enabled: true,
      isSuperAdmin: true,
    },
    update: {
      username: email,
      displayName: email.split("@", 1)[0],
      passwordHash: hashPassword(password),
      passwordMethod: 0,
      enabled: true,
      isSuperAdmin: true,
    },
  });
  console.log("Admin bootstrap completed.");
} finally {
  await db.$disconnect();
  await pool.end();
}
