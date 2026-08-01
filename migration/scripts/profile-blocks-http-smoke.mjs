import assert from "node:assert/strict";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const marker = `blocks_http_${Date.now()}`;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });
let blockerId;
let targetId;
let blockerSession;
let targetSession;

try {
  const blocker = await db.user.create({
    data: {
      email: `${marker}_blocker@example.invalid`,
      username: `${marker}_blocker`,
      displayName: "HTTP Blocker",
      passwordHash: "smoke-only",
      verifiedAt: new Date(),
      profilePrivacy: 63,
    },
    select: { id: true, username: true },
  });
  blockerId = blocker.id;

  const target = await db.user.create({
    data: {
      email: `${marker}_target@example.invalid`,
      username: `${marker}_target`,
      displayName: "HTTP Blocked Target",
      passwordHash: "smoke-only",
      verifiedAt: new Date(),
      profilePrivacy: 63,
    },
    select: { id: true, username: true },
  });
  targetId = target.id;

  await db.profileBlock.create({ data: { blockerId, blockedId: targetId } });
  blockerSession = `${marker}_blocker_session`;
  targetSession = `${marker}_target_session`;
  await db.authSession.createMany({
    data: [
      { id: blockerSession, userId: blockerId, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
      { id: targetSession, userId: targetId, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    ],
  });

  const root = await fetch("http://localhost:3000/");
  assert.equal(root.status, 200, "la portada debe responder 200");

  const anonymousBlocks = await fetch("http://localhost:3000/account/blocks", { redirect: "manual" });
  assert.equal(anonymousBlocks.status, 307, "la lista de bloqueos requiere sesión");

  const blockerHeaders = { Cookie: `social_session=${blockerSession}` };
  const targetHeaders = { Cookie: `social_session=${targetSession}` };

  const blockerProfile = await fetch(`http://localhost:3000/profile/${target.username}`, { headers: blockerHeaders });
  const blockerProfileHtml = await blockerProfile.text();
  assert.equal(blockerProfile.status, 200, "el bloqueador debe recibir una superficie de desbloqueo");
  assert.match(blockerProfileHtml, /Has bloqueado este perfil/);
  assert.match(blockerProfileHtml, /Desbloquear usuario/);
  assert.equal(blockerProfileHtml.includes("HTTP Blocked Target"), false, "la vista bloqueada no debe cargar el nombre objetivo");
  assert.equal(blockerProfileHtml.includes(`${marker}_target@example.invalid`), false, "la vista bloqueada no debe exponer el email objetivo");

  const targetProfile = await fetch(`http://localhost:3000/profile/${blocker.username}`, { headers: targetHeaders });
  const targetProfileHtml = await targetProfile.text();
  assert.equal(targetProfile.status, 200, "el bloqueado debe recibir una respuesta privada estable");
  assert.match(targetProfileHtml, /Perfil restringido/);
  assert.equal(targetProfileHtml.includes("HTTP Blocker"), false, "el bloqueado no debe ver el nombre del bloqueador");

  const blocksPage = await fetch("http://localhost:3000/account/blocks", { headers: blockerHeaders });
  const blocksHtml = await blocksPage.text();
  assert.equal(blocksPage.status, 200, "el bloqueador debe ver su lista");
  assert.match(blocksHtml, /Perfiles bloqueados/);
  assert.match(blocksHtml, /HTTP Blocked Target/);
  assert.equal(blocksHtml.includes(`${marker}_target@example.invalid`), false, "la lista no debe mostrar emails");

  console.log("PROFILE_BLOCKS_HTTP_SMOKE_PASS", JSON.stringify({ root: root.status, anonymousBlocks: anonymousBlocks.status, blockerProfile: blockerProfile.status, targetProfile: targetProfile.status, blocksPage: blocksPage.status }));
} finally {
  await db.user.deleteMany({ where: { id: { in: [blockerId, targetId].filter(Boolean) } } });
  const remainingUsers = await db.user.count({ where: { email: { contains: marker } } });
  const remainingBlocks = await db.profileBlock.count({ where: { blocker: { email: { contains: marker } } } });
  const remainingSessions = await db.authSession.count({ where: { id: { in: [blockerSession, targetSession].filter(Boolean) } } });
  assert.equal(remainingUsers, 0, "los usuarios HTTP sintéticos deben limpiarse");
  assert.equal(remainingBlocks, 0, "los bloqueos HTTP sintéticos deben limpiarse");
  assert.equal(remainingSessions, 0, "las sesiones HTTP sintéticas deben limpiarse");
  console.log("PROFILE_BLOCKS_HTTP_SMOKE_CLEANUP_PASS");
  await db.$disconnect();
  await pool.end();
}
