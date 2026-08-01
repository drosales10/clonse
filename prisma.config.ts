import "dotenv/config";

import { defineConfig, env } from "prisma/config";

import { normalizeDatabaseUrl } from "./packages/db/src/database-url";

export default defineConfig({
  schema: "packages/db/schema.prisma",
  migrations: {
    path: "packages/db/prisma/migrations",
  },
  datasource: {
    url: normalizeDatabaseUrl(env("DATABASE_URL")),
  },
});
