import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const catalogTables = {
  user_levels: ["id", "legacy_id", "name", "description", "is_default", "is_signup", "capabilities", "created_at", "updated_at"],
  subnetworks: ["id", "legacy_id", "name_legacy_id", "field1_qualifier", "field1_value", "field2_qualifier", "field2_value", "theme_legacy_id", "created_at", "updated_at"],
  language_variables: ["id", "legacy_id", "language_id", "value", "default_value", "created_at", "updated_at"],
  settings: ["id", "legacy_id", "key", "version", "is_online", "url_enabled", "username_enabled", "subnet_field1_id", "subnet_field2_id", "created_at", "updated_at"],
};

const expectedUniqueIndexes = [
  { table: "user_levels", name: "user_levels_legacy_id_key" },
  { table: "subnetworks", name: "subnetworks_legacy_id_key" },
  { table: "language_variables", name: "language_variables_legacy_id_language_id_key" },
  { table: "settings", name: "settings_legacy_id_key" },
];

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function assertComplete(label, missing) {
  if (missing.length > 0) {
    throw new Error(`${label} missing: ${missing.join(", ")}`);
  }
}

const databaseUrl = new URL(required("DATABASE_URL").replace(/^postgresql\+asyncpg:/i, "postgresql:")).toString();
const pool = new Pool({ connectionString: databaseUrl, max: 1 });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });

try {
  const tableNames = Object.keys(catalogTables);
  const [columnsResult, indexesResult, foreignKeysResult] = await Promise.all([
    pool.query(
      `SELECT table_name, column_name
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
      [tableNames],
    ),
    pool.query(
      `SELECT tablename AS table_name, indexname AS index_name
       FROM pg_indexes
       WHERE schemaname = 'public' AND indexname = ANY($1::text[])`,
      [expectedUniqueIndexes.map((index) => index.name)],
    ),
    pool.query(
      `SELECT child.relname AS table_name, con.conname AS constraint_name
       FROM pg_constraint con
       JOIN pg_class child ON child.oid = con.conrelid
       JOIN pg_namespace namespace ON namespace.oid = child.relnamespace
       WHERE namespace.nspname = 'public'
         AND child.relname = ANY($1::text[])
         AND con.contype = 'f'`,
      [tableNames],
    ),
  ]);

  const columnsByTable = new Map(tableNames.map((table) => [table, new Set()]));
  for (const row of columnsResult.rows) {
    columnsByTable.get(row.table_name)?.add(row.column_name);
  }

  for (const [table, expectedColumns] of Object.entries(catalogTables)) {
    const actualColumns = columnsByTable.get(table) ?? new Set();
    assertComplete(`${table} columns`, expectedColumns.filter((column) => !actualColumns.has(column)));
  }

  const actualIndexes = new Set(indexesResult.rows.map((row) => row.index_name));
  assertComplete("unique indexes", expectedUniqueIndexes.map((index) => index.name).filter((name) => !actualIndexes.has(name)));

  if (foreignKeysResult.rows.length > 0) {
    throw new Error(`unexpected foreign keys: ${foreignKeysResult.rows.map((row) => `${row.table_name}.${row.constraint_name}`).join(", ")}`);
  }

  const [userLevels, subnetworks, languageVariables, settings] = await Promise.all([
    db.userLevel.count(),
    db.subnetwork.count(),
    db.languageVariable.count(),
    db.setting.count(),
  ]);

  console.log(JSON.stringify({
    schema: "public",
    tables: tableNames,
    structure: {
      columns: "ok",
      uniqueIndexes: "ok",
      foreignKeys: 0,
    },
    counts: { userLevels, subnetworks, languageVariables, settings },
  }));
} finally {
  await db.$disconnect();
  await pool.end();
}
