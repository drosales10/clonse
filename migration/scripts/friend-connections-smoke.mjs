import assert from "node:assert/strict";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

import { canViewProfile } from "../../packages/domain/src/profile.ts";

const marker = `friends_smoke_${Date.now()}`;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });
let ownerId;
let requesterId;
let outsiderId;

async function createSmokeUser(suffix, displayName) {
  return db.user.create({
    data: {
      email: `${marker}_${suffix}@example.invalid`,
      username: `${marker}_${suffix}`,
      displayName,
      passwordHash: "smoke-only",
      verifiedAt: new Date(),
      profilePrivacy: 3,
    },
    select: { id: true, username: true },
  });
}

try {
  const owner = await createSmokeUser("owner", "Smoke Owner");
  const requester = await createSmokeUser("requester", "Smoke Requester");
  const outsider = await createSmokeUser("outsider", "Smoke Outsider");
  ownerId = owner.id;
  requesterId = requester.id;
  outsiderId = outsider.id;

  const pending = await db.friendConnection.create({
    data: { requesterId, addresseeId: ownerId, status: "pending" },
    select: { id: true, status: true },
  });
  assert.equal(pending.status, "pending");

  const duplicateCount = await db.friendConnection.count({
    where: {
      OR: [
        { requesterId, addresseeId: ownerId },
        { requesterId: ownerId, addresseeId: requesterId },
      ],
    },
  });
  assert.equal(duplicateCount, 1, "una solicitud no debe duplicarse entre las mismas cuentas");

  const unauthorizedAccept = await db.friendConnection.updateMany({
    where: { requesterId, addresseeId: outsiderId, status: "pending" },
    data: { status: "accepted" },
  });
  assert.equal(unauthorizedAccept.count, 0, "un tercero no puede aceptar una solicitud ajena");

  const accepted = await db.friendConnection.updateMany({
    where: { requesterId, addresseeId: ownerId, status: "pending" },
    data: { status: "accepted" },
  });
  assert.equal(accepted.count, 1, "el destinatario debe poder aceptar la solicitud");

  const publicConnection = await db.friendConnection.findFirst({
    where: {
      status: "accepted",
      OR: [
        { requesterId: ownerId, addresseeId: requesterId },
        { requesterId: requesterId, addresseeId: ownerId },
      ],
    },
    select: {
      requesterId: true,
      addresseeId: true,
      requester: { select: { username: true, displayName: true } },
      addressee: { select: { username: true, displayName: true } },
    },
  });
  assert.ok(publicConnection, "la conexión aceptada debe ser legible");
  assert.equal("email" in publicConnection.requester, false, "el DTO público no debe seleccionar emails");
  assert.equal(canViewProfile(ownerId, 3, requesterId, true), true, "una amistad puede ver la máscara de amistad");
  assert.equal(canViewProfile(ownerId, 3, outsiderId, false), false, "un tercero no puede ver la máscara de amistad");
  assert.equal(canViewProfile(ownerId, 3, null, false), false, "un anónimo no puede ver la máscara de amistad");

  const removed = await db.friendConnection.deleteMany({
    where: {
      status: "accepted",
      OR: [
        { requesterId: ownerId, addresseeId: requesterId },
        { requesterId, addresseeId: ownerId },
      ],
    },
  });
  assert.equal(removed.count, 1, "cualquiera de los participantes puede eliminar la conexión");

  await db.friendConnection.create({ data: { requesterId, addresseeId: ownerId, status: "pending" } });
  const rejected = await db.friendConnection.deleteMany({
    where: { requesterId, addresseeId: ownerId, status: "pending" },
  });
  assert.equal(rejected.count, 1, "el destinatario puede rechazar la solicitud");

  await db.friendConnection.create({ data: { requesterId, addresseeId: ownerId, status: "pending" } });
  const cancelled = await db.friendConnection.deleteMany({
    where: { requesterId, addresseeId: ownerId, status: "pending" },
  });
  assert.equal(cancelled.count, 1, "el solicitante puede cancelar la solicitud");

  const outsiderConnections = await db.friendConnection.count({
    where: { OR: [{ requesterId: outsiderId }, { addresseeId: outsiderId }] },
  });
  assert.equal(outsiderConnections, 0, "un usuario ajeno no debe recibir conexiones por estas transiciones");

  console.log("FRIEND_CONNECTIONS_SMOKE_PASS", JSON.stringify({ duplicateCount, accepted: accepted.count, outsiderConnections }));
} finally {
  await db.user.deleteMany({ where: { id: { in: [ownerId, requesterId, outsiderId].filter(Boolean) } } });
  const remainingUsers = await db.user.count({ where: { email: { contains: marker } } });
  const remainingConnections = await db.friendConnection.count({
    where: { requester: { email: { contains: marker } } },
  });
  assert.equal(remainingUsers, 0, "los usuarios sintéticos deben limpiarse");
  assert.equal(remainingConnections, 0, "las conexiones sintéticas deben limpiarse");
  console.log("FRIEND_CONNECTIONS_SMOKE_CLEANUP_PASS");
  await db.$disconnect();
  await pool.end();
}
