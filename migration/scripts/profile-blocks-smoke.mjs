import assert from "node:assert/strict";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const marker = `blocks_smoke_${Date.now()}`;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });
let blockerId;
let targetId;
let thirdId;

async function createUser(suffix, displayName) {
  return db.user.create({
    data: {
      email: `${marker}_${suffix}@example.invalid`,
      username: `${marker}_${suffix}`,
      displayName,
      passwordHash: "smoke-only",
      verifiedAt: new Date(),
    },
    select: { id: true, username: true },
  });
}

try {
  const blocker = await createUser("blocker", "Smoke Blocker");
  const target = await createUser("target", "Smoke Target");
  const third = await createUser("third", "Smoke Third");
  blockerId = blocker.id;
  targetId = target.id;
  thirdId = third.id;

  await db.friendConnection.create({ data: { requesterId: blockerId, addresseeId: targetId, status: "accepted" } });
  await db.friendConnection.create({ data: { requesterId: targetId, addresseeId: thirdId, status: "pending" } });
  await db.friendConnection.create({ data: { requesterId: thirdId, addresseeId: targetId, status: "pending" } });

  await db.$transaction([
    db.profileBlock.create({ data: { blockerId, blockedId: targetId } }),
    db.friendConnection.deleteMany({
      where: {
        OR: [
          { requesterId: blockerId, addresseeId: targetId },
          { requesterId: targetId, addresseeId: blockerId },
        ],
      },
    }),
  ]);

  const blockCount = await db.profileBlock.count({ where: { blockerId, blockedId: targetId } });
  assert.equal(blockCount, 1, "el bloqueo debe persistir una sola vez");

  const deletedTargetConnections = await db.friendConnection.count({
    where: { OR: [{ requesterId: blockerId, addresseeId: targetId }, { requesterId: targetId, addresseeId: blockerId }] },
  });
  assert.equal(deletedTargetConnections, 0, "el bloqueo debe eliminar la conexión directa");

  const unrelatedConnections = await db.friendConnection.count({
    where: { OR: [{ requesterId: targetId }, { addresseeId: targetId }] },
  });
  assert.equal(unrelatedConnections, 2, "el bloqueo no debe eliminar relaciones con terceros");

  const duplicateBlock = await db.profileBlock.count({ where: { blockerId, blockedId: targetId } });
  assert.equal(duplicateBlock, 1, "el bloqueo debe ser idempotente");

  const unauthorizedUnblock = await db.profileBlock.deleteMany({ where: { blockerId: targetId, blockedId: blockerId } });
  assert.equal(unauthorizedUnblock.count, 0, "el bloqueado no puede desbloquear al bloqueador");

  const unblocked = await db.profileBlock.deleteMany({ where: { blockerId, blockedId: targetId } });
  assert.equal(unblocked.count, 1, "el bloqueador debe poder desbloquear");

  console.log("PROFILE_BLOCKS_SMOKE_PASS", JSON.stringify({ blockCount, deletedTargetConnections, unrelatedConnections, unauthorizedUnblock: unauthorizedUnblock.count }));
} finally {
  await db.user.deleteMany({ where: { id: { in: [blockerId, targetId, thirdId].filter(Boolean) } } });
  const remainingUsers = await db.user.count({ where: { email: { contains: marker } } });
  const remainingBlocks = await db.profileBlock.count({ where: { blocker: { email: { contains: marker } } } });
  const remainingConnections = await db.friendConnection.count({ where: { requester: { email: { contains: marker } } } });
  assert.equal(remainingUsers, 0, "los usuarios sintéticos deben limpiarse");
  assert.equal(remainingBlocks, 0, "los bloqueos sintéticos deben limpiarse");
  assert.equal(remainingConnections, 0, "las conexiones sintéticas deben limpiarse");
  console.log("PROFILE_BLOCKS_SMOKE_CLEANUP_PASS");
  await db.$disconnect();
  await pool.end();
}
