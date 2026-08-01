import assert from "node:assert/strict";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const marker = `presence_http_${Date.now()}`;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });
let userIds = [];
let sessionIds = [];

async function createUser(suffix, profilePrivacy = 63, lastActiveAt = null) {
  return db.user.create({
    data: {
      email: `${marker}_${suffix}@example.invalid`,
      username: `${marker}_${suffix}`,
      displayName: `Presence ${suffix}`,
      passwordHash: "smoke-only",
      verifiedAt: new Date(),
      profilePrivacy,
      lastActiveAt,
    },
    select: { id: true, username: true, lastActiveAt: true },
  });
}

try {
  const recent = await createUser("recent", 63, new Date());
  const privateUser = await createUser("private", 1, new Date());
  const blocker = await createUser("blocker", 63, new Date());
  const blocked = await createUser("blocked", 63, new Date());
  const active = await createUser("active", 63, new Date(Date.now() - 60 * 60 * 1000));
  userIds = [recent.id, privateUser.id, blocker.id, blocked.id, active.id];

  await db.profileBlock.create({ data: { blockerId: blocker.id, blockedId: blocked.id } });
  const activeSession = `${marker}_active_session`;
  const blockerSession = `${marker}_blocker_session`;
  sessionIds = [activeSession, blockerSession];
  await db.authSession.createMany({
    data: [
      { id: activeSession, userId: active.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
      { id: blockerSession, userId: blocker.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    ],
  });

  const root = await fetch("http://localhost:3000/");
  assert.equal(root.status, 200, "la portada debe responder 200");

  const publicProfile = await fetch(`http://localhost:3000/profile/${recent.username}`);
  const publicHtml = await publicProfile.text();
  assert.equal(publicProfile.status, 200, "el perfil público debe responder 200");
  assert.match(publicHtml, /En línea/, "el perfil público debe mostrar presencia online");
  assert.equal(publicHtml.includes(recent.lastActiveAt.toISOString()), false, "el HTML no debe exponer el timestamp exacto");
  assert.equal(publicHtml.includes("lastActiveAt"), false, "el HTML no debe exponer el nombre del campo interno");

  const privateProfile = await fetch(`http://localhost:3000/profile/${privateUser.username}`);
  const privateHtml = await privateProfile.text();
  assert.equal(privateProfile.status, 200, "el perfil privado debe responder con una superficie estable");
  assert.match(privateHtml, /Perfil restringido/);
  assert.equal(privateHtml.includes("En línea"), false, "el perfil privado no debe exponer presencia");
  assert.equal(privateHtml.includes("Desconectado"), false, "el perfil privado no debe exponer presencia");

  const blockerProfile = await fetch(`http://localhost:3000/profile/${blocked.username}`, {
    headers: { Cookie: `social_session=${blockerSession}` },
  });
  const blockerHtml = await blockerProfile.text();
  assert.equal(blockerProfile.status, 200, "una superficie bloqueada debe responder 200");
  assert.match(blockerHtml, /Perfil público|Perfil restringido|Has bloqueado este perfil/);
  assert.equal(blockerHtml.includes("En línea"), false, "un perfil bloqueado no debe exponer presencia");
  assert.equal(blockerHtml.includes("Desconectado"), false, "un perfil bloqueado no debe exponer presencia");

  const beforeActive = await db.user.findUnique({ where: { id: active.id }, select: { lastActiveAt: true } });
  assert.ok(beforeActive?.lastActiveAt, "el usuario autenticado debe partir con lastActiveAt sintético");
  const authenticatedProfile = await fetch(`http://localhost:3000/profile/${active.username}`, {
    headers: { Cookie: `social_session=${activeSession}` },
  });
  assert.equal(authenticatedProfile.status, 200, "la sesión sintética debe poder consultar su perfil");
  const afterActive = await db.user.findUnique({ where: { id: active.id }, select: { lastActiveAt: true } });
  assert.ok(afterActive?.lastActiveAt && afterActive.lastActiveAt > beforeActive.lastActiveAt, "la sesión válida debe actualizar lastActiveAt");

  console.log("PRESENCE_HTTP_SMOKE_PASS", JSON.stringify({ root: root.status, publicProfile: publicProfile.status, privateProfile: privateProfile.status, blockedProfile: blockerProfile.status, authenticatedProfile: authenticatedProfile.status }));
} finally {
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  const remainingUsers = await db.user.count({ where: { email: { contains: marker } } });
  const remainingBlocks = await db.profileBlock.count({ where: { blocker: { email: { contains: marker } } } });
  const remainingSessions = await db.authSession.count({ where: { id: { in: sessionIds } } });
  assert.equal(remainingUsers, 0, "los usuarios HTTP sintéticos deben limpiarse");
  assert.equal(remainingBlocks, 0, "los bloqueos sintéticos deben limpiarse");
  assert.equal(remainingSessions, 0, "las sesiones HTTP sintéticas deben limpiarse");
  console.log("PRESENCE_HTTP_SMOKE_CLEANUP_PASS");
  await db.$disconnect();
  await pool.end();
}
