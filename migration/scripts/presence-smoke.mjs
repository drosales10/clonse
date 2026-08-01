import assert from "node:assert/strict";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

import { PRESENCE_WINDOW_MS, presenceFromLastActiveAt } from "../../packages/domain/src/presence.ts";

const marker = `presence_smoke_${Date.now()}`;
const now = new Date();
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });
let userIds = [];

try {
  const users = await db.user.createManyAndReturn({
    data: [
      {
        email: `${marker}_recent@example.invalid`,
        username: `${marker}_recent`,
        displayName: "Presence Recent",
        passwordHash: "smoke-only",
        verifiedAt: now,
        lastActiveAt: new Date(now.getTime() - 2 * 60 * 1000),
      },
      {
        email: `${marker}_old@example.invalid`,
        username: `${marker}_old`,
        displayName: "Presence Old",
        passwordHash: "smoke-only",
        verifiedAt: now,
        lastActiveAt: new Date(now.getTime() - PRESENCE_WINDOW_MS - 1),
      },
      {
        email: `${marker}_null@example.invalid`,
        username: `${marker}_null`,
        displayName: "Presence Null",
        passwordHash: "smoke-only",
        verifiedAt: now,
        lastActiveAt: null,
      },
    ],
    select: { id: true, lastActiveAt: true },
  });
  userIds = users.map(({ id }) => id);

  const recent = users.find(({ lastActiveAt }) => lastActiveAt)?.lastActiveAt ?? null;
  const old = users.find(({ lastActiveAt }) => lastActiveAt && now.getTime() - lastActiveAt.getTime() > PRESENCE_WINDOW_MS)?.lastActiveAt ?? null;
  const missing = users.find(({ lastActiveAt }) => lastActiveAt === null)?.lastActiveAt ?? null;

  assert.equal(presenceFromLastActiveAt(recent, now).status, "online");
  assert.equal(presenceFromLastActiveAt(old, now).status, "offline");
  assert.equal(presenceFromLastActiveAt(missing, now).status, "offline");
  assert.equal(presenceFromLastActiveAt(new Date(now.getTime() - PRESENCE_WINDOW_MS), now).status, "online");
  assert.equal(presenceFromLastActiveAt(new Date(now.getTime() - PRESENCE_WINDOW_MS - 1), now).status, "offline");

  console.log("PRESENCE_SMOKE_PASS", JSON.stringify({ windowMs: PRESENCE_WINDOW_MS, recent: "online", old: "offline", missing: "offline" }));
} finally {
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  const remainingUsers = await db.user.count({ where: { email: { contains: marker } } });
  assert.equal(remainingUsers, 0, "los usuarios sintéticos de presencia deben limpiarse");
  console.log("PRESENCE_SMOKE_CLEANUP_PASS");
  await db.$disconnect();
  await pool.end();
}
