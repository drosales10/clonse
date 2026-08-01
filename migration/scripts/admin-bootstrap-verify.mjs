import "dotenv/config";
import { scryptSync, timingSafeEqual } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const databaseUrl = new URL(required("DATABASE_URL").replace(/^postgresql\+asyncpg:/i, "postgresql:")).toString();
const pool = new Pool({ connectionString: databaseUrl, max: 1 });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });

try {
  const [adminCount, enabledSuperAdminCount, admin] = await Promise.all([
    db.admin.count(),
    db.admin.count({ where: { enabled: true, isSuperAdmin: true } }),
    db.admin.findFirst({ where: { enabled: true, isSuperAdmin: true }, select: { passwordHash: true } }),
  ]);
  const [, saltHex, keyHex] = admin?.passwordHash.split(":") ?? [];
  const expected = keyHex ? Buffer.from(keyHex, "hex") : Buffer.alloc(0);
  const actual = saltHex ? scryptSync(required("SEED_ADMIN_PASSWORD"), Buffer.from(saltHex, "hex"), expected.length) : Buffer.alloc(0);
  console.log(JSON.stringify({
    adminCount,
    enabledSuperAdminCount,
    passwordMatches: expected.length > 0 && expected.length === actual.length && timingSafeEqual(expected, actual),
  }));
} finally {
  await db.$disconnect();
  await pool.end();
}
