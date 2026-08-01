import "dotenv/config";
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
  const [userLevels, subnetworks, languageVariables, settings] = await Promise.all([
    db.userLevel.count(),
    db.subnetwork.count(),
    db.languageVariable.count(),
    db.setting.count(),
  ]);

  console.log(JSON.stringify({
    tables: ["user_levels", "subnetworks", "language_variables", "settings"],
    counts: { userLevels, subnetworks, languageVariables, settings },
  }));
} finally {
  await db.$disconnect();
  await pool.end();
}
