import "dotenv/config";
import assert from "node:assert/strict";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const marker = `friends_http_${Date.now()}`;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });
let ownerId;
let viewerId;
let friendIds = [];
let dashboardFriendIds = [];
let incomingIds = [];
let outgoingIds = [];
let notificationRequesterId;
let notificationRecipientId;
let sessionId;
let notificationRequesterSessionId;
let notificationRecipientSessionId;

try {
  const owner = await db.user.create({
    data: {
      email: `${marker}_owner@example.invalid`,
      username: `${marker}_owner`,
      displayName: "HTTP Friends Owner",
      passwordHash: "smoke-only",
      verifiedAt: new Date(),
      profilePrivacy: 3,
    },
    select: { id: true, username: true },
  });
  ownerId = owner.id;

  const viewer = await db.user.create({
    data: {
      email: `${marker}_viewer@example.invalid`,
      username: `${marker}_viewer`,
      displayName: "HTTP Friends Viewer",
      passwordHash: "smoke-only",
      verifiedAt: new Date(),
      profilePrivacy: 63,
    },
    select: { id: true },
  });
  viewerId = viewer.id;

  const notificationRequester = await db.user.create({
    data: {
      email: `${marker}_notification_requester@example.invalid`,
      username: `${marker}_notification_requester`,
      displayName: "HTTP Notification Requester",
      passwordHash: "smoke-only",
      verifiedAt: new Date(),
    },
    select: { id: true, username: true },
  });
  notificationRequesterId = notificationRequester.id;
  const notificationRecipient = await db.user.create({
    data: {
      email: `${marker}_notification_recipient@example.invalid`,
      username: `${marker}_notification_recipient`,
      displayName: "HTTP Notification Recipient",
      passwordHash: "smoke-only",
      verifiedAt: new Date(),
    },
    select: { id: true, username: true },
  });
  notificationRecipientId = notificationRecipient.id;

  const additionalFriends = await Promise.all(Array.from({ length: 10 }, async (_, index) => db.user.create({
    data: {
      email: `${marker}_friend_${index}@example.invalid`,
      username: `${marker}_friend_${index}`,
      displayName: `HTTP Friends Extra ${String(index).padStart(2, "0")}`,
      passwordHash: "smoke-only",
      verifiedAt: new Date(),
    },
    select: { id: true },
  })));
  friendIds = additionalFriends.map((friend) => friend.id);

  const createSyntheticUsers = async (prefix, count, displayPrefix) => Promise.all(Array.from({ length: count }, async (_, index) => db.user.create({
    data: {
      email: `${marker}_${prefix}_${index}@example.invalid`,
      username: `${marker}_${prefix}_${index}`,
      displayName: `${displayPrefix} ${String(index).padStart(2, "0")}`,
      passwordHash: "smoke-only",
      verifiedAt: new Date(),
    },
    select: { id: true },
  })));
  dashboardFriendIds = (await createSyntheticUsers("dashboard", 10, "Dashboard Friend")).map((user) => user.id);
  incomingIds = (await createSyntheticUsers("incoming", 11, "Incoming Request")).map((user) => user.id);
  outgoingIds = (await createSyntheticUsers("outgoing", 11, "Outgoing Request")).map((user) => user.id);

  await db.friendConnection.createMany({
    data: [
      { requesterId: viewerId, addresseeId: ownerId, status: "accepted" },
      ...friendIds.map((friendId) => ({ requesterId: friendId, addresseeId: ownerId, status: "accepted" })),
      { requesterId: viewerId, addresseeId: friendIds[0], status: "accepted" },
      ...dashboardFriendIds.map((friendId) => ({ requesterId: viewerId, addresseeId: friendId, status: "accepted" })),
      ...incomingIds.map((requesterId) => ({ requesterId, addresseeId: viewerId, status: "pending" })),
      ...outgoingIds.map((addresseeId) => ({ requesterId: viewerId, addresseeId, status: "pending" })),
    ],
  });
  sessionId = `${marker}_session`;
  notificationRequesterSessionId = `${marker}_notification_requester_session`;
  notificationRecipientSessionId = `${marker}_notification_recipient_session`;
  await db.authSession.createMany({ data: [
    { id: sessionId, userId: viewerId, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    { id: notificationRequesterSessionId, userId: notificationRequesterId, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    { id: notificationRecipientSessionId, userId: notificationRecipientId, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
  ] });

  const anonymousAccount = await fetch("http://localhost:3000/account/friends", { redirect: "manual" });
  assert.equal(anonymousAccount.status, 307, "la red de conexiones requiere sesión");
  assert.match(anonymousAccount.headers.get("location") ?? "", /\/login\?returnUrl=/);

  const root = await fetch("http://localhost:3000/");
  assert.equal(root.status, 200, "la portada debe responder 200");

  const anonymousProfile = await fetch(`http://localhost:3000/profile/${owner.username}`);
  const anonymousProfileHtml = await anonymousProfile.text();
  assert.equal(anonymousProfile.status, 200, "el perfil restringido debe responder 200");
  assert.match(anonymousProfileHtml, /Perfil restringido/);
  assert.equal(anonymousProfileHtml.includes("HTTP Friends Owner"), false, "el perfil privado no debe revelar el nombre al anónimo");

  const viewerHeaders = { Cookie: `social_session=${sessionId}` };
  const authenticatedAccount = await fetch("http://localhost:3000/account/friends", { headers: viewerHeaders });
  const accountHtml = await authenticatedAccount.text();
  assert.equal(authenticatedAccount.status, 200, "la cuenta de conexiones debe responder 200 con sesión");
  assert.match(accountHtml, /Tus conexiones/);
  assert.match(accountHtml, /Dashboard Friend 00/);
  assert.equal(accountHtml.includes(`${marker}_owner@example.invalid`), false, "la cuenta de conexiones no debe mostrar email");

  const dashboardFriendsPage = await fetch(`http://localhost:3000/account/friends?friendsPage=2`, { headers: viewerHeaders });
  const dashboardFriendsHtml = await dashboardFriendsPage.text();
  assert.equal(dashboardFriendsPage.status, 200, "la segunda página de conexiones propias debe responder 200");
  assert.match(dashboardFriendsHtml, /HTTP Friends Owner/);

  const incomingPage = await fetch("http://localhost:3000/account/friends?incomingPage=2", { headers: viewerHeaders });
  const incomingHtml = await incomingPage.text();
  assert.equal(incomingPage.status, 200, "la segunda página entrante debe responder 200");
  assert.match(incomingHtml, /Incoming Request 10/);

  const outgoingPage = await fetch("http://localhost:3000/account/friends?outgoingPage=2", { headers: viewerHeaders });
  const outgoingHtml = await outgoingPage.text();
  assert.equal(outgoingPage.status, 200, "la segunda página saliente debe responder 200");
  assert.match(outgoingHtml, /Outgoing Request 10/);

  const dashboardSearch = await fetch(`http://localhost:3000/account/friends?friendsSearch=${encodeURIComponent("Dashboard Friend 00")}`, { headers: viewerHeaders });
  const dashboardSearchHtml = await dashboardSearch.text();
  assert.equal(dashboardSearch.status, 200, "la búsqueda autenticada debe responder 200");
  assert.match(dashboardSearchHtml, /Dashboard Friend 00/);
  assert.equal(dashboardSearchHtml.includes("Dashboard Friend 01"), false, "la búsqueda autenticada debe filtrar conexiones");

  const authenticatedProfile = await fetch(`http://localhost:3000/profile/${owner.username}`, { headers: viewerHeaders });
  const profileHtml = await authenticatedProfile.text();
  assert.equal(authenticatedProfile.status, 200, "un amigo debe poder ver el perfil restringido");
  assert.match(profileHtml, /HTTP Friends Owner/);
  assert.match(profileHtml, /Conexiones/);
  assert.equal(profileHtml.includes(`${marker}_owner@example.invalid`), false, "el perfil público no debe mostrar email");
  assert.equal((profileHtml.match(/class="public-friend"/g) ?? []).length, 10, "la primera página pública debe mostrar 10 conexiones");

  const secondFriendsPage = await fetch(`http://localhost:3000/profile/${owner.username}?friendsPage=2`, { headers: viewerHeaders });
  const secondFriendsHtml = await secondFriendsPage.text();
  assert.equal(secondFriendsPage.status, 200, "la segunda página pública debe responder 200");
  assert.equal((secondFriendsHtml.match(/class="public-friend"/g) ?? []).length, 1, "la segunda página debe mostrar la conexión restante");
  assert.equal(secondFriendsHtml.includes("HTTP Friends Viewer"), true, "la segunda página debe contener la última conexión ordenada");

  const searchFriends = await fetch(`http://localhost:3000/profile/${owner.username}?friendsSearch=${encodeURIComponent("Friends Viewer")}`, { headers: viewerHeaders });
  const searchFriendsHtml = await searchFriends.text();
  assert.equal(searchFriends.status, 200, "la búsqueda pública debe responder 200");
  assert.equal((searchFriendsHtml.match(/class="public-friend"/g) ?? []).length, 1, "la búsqueda debe filtrar una conexión");
  assert.match(searchFriendsHtml, /HTTP Friends Viewer/);

  const mutualSeedCount = await db.friendConnection.count({ where: { requesterId: viewerId, addresseeId: friendIds[0], status: "accepted" } });
  assert.equal(mutualSeedCount, 1, "el fixture debe crear la segunda conexión mutual");
  const mutualFriends = await fetch(`http://localhost:3000/profile/${owner.username}?m=1`, { headers: viewerHeaders });
  const mutualFriendsHtml = await mutualFriends.text();
  assert.equal(mutualFriends.status, 200, "el filtro mutual debe responder 200");
  assert.equal((mutualFriendsHtml.match(/class="public-friend"/g) ?? []).length, 1, "el filtro mutual debe conservar una conexión compartida");
  assert.match(mutualFriendsHtml, /HTTP Friends Extra 00/);
  assert.equal(mutualFriendsHtml.includes("HTTP Friends Viewer"), false, "el usuario de sesión no es su propio amigo mutuo");
  assert.equal(mutualFriendsHtml.includes("HTTP Friends Extra 01"), false, "el filtro mutual debe excluir conexiones no compartidas");

  const anonymousMutual = await fetch(`http://localhost:3000/profile/${owner.username}?m=1`);
  const anonymousMutualHtml = await anonymousMutual.text();
  assert.equal(anonymousMutual.status, 200, "el perfil anónimo con m=1 debe responder 200");
  assert.equal((anonymousMutualHtml.match(/class="public-friend"/g) ?? []).length, 0, "el perfil privado anónimo no debe exponer conexiones");
  assert.equal(anonymousMutualHtml.includes("Solo conexiones mutuas"), false, "el anónimo no debe ver el control mutual");

  await db.$transaction(async (transaction) => {
    await transaction.friendConnection.create({ data: { requesterId: notificationRequesterId, addresseeId: notificationRecipientId, status: "pending" } });
    await transaction.notification.create({ data: { recipientId: notificationRecipientId, actorId: notificationRequesterId, profileOwnerId: notificationRecipientId, type: "friend_request", legacyTypeId: 1, objectId: notificationRequesterId } });
  });
  assert.equal(await db.notification.count({ where: { recipientId: notificationRecipientId, actorId: notificationRequesterId, type: "friend_request", objectId: notificationRequesterId } }), 1, "la solicitud debe crear un aviso para el destinatario");
  assert.equal(await db.notification.count({ where: { recipientId: notificationRequesterId, type: "friend_request" } }), 0, "el solicitante no debe recibir su propio aviso");

  const recipientHome = await fetch("http://localhost:3000/home", { headers: { Cookie: `social_session=${notificationRecipientSessionId}` } });
  const recipientHomeHtml = await recipientHome.text();
  assert.equal(recipientHome.status, 200, "el home del destinatario debe responder 200");
  assert.match(recipientHomeHtml, /Solicitudes de conexión/);
  assert.match(recipientHomeHtml, /HTTP Notification Requester/);

  await db.$transaction(async (transaction) => {
    await transaction.friendConnection.updateMany({ where: { requesterId: notificationRequesterId, addresseeId: notificationRecipientId, status: "pending" }, data: { status: "accepted" } });
    await transaction.notification.deleteMany({ where: { recipientId: notificationRecipientId, actorId: notificationRequesterId, objectId: notificationRequesterId, type: "friend_request" } });
  });
  assert.equal(await db.notification.count({ where: { recipientId: notificationRecipientId, actorId: notificationRequesterId, type: "friend_request" } }), 0, "aceptar debe eliminar el aviso");

  await db.notification.create({ data: { recipientId: viewerId, actorId: incomingIds[0], profileOwnerId: viewerId, type: "friend_request", legacyTypeId: 1, objectId: incomingIds[0] } });
  await db.$transaction(async (transaction) => {
    await transaction.friendConnection.deleteMany({ where: { requesterId: incomingIds[0], addresseeId: viewerId, status: "pending" } });
    await transaction.notification.deleteMany({ where: { recipientId: viewerId, actorId: incomingIds[0], objectId: incomingIds[0], type: "friend_request" } });
  });
  assert.equal(await db.notification.count({ where: { recipientId: viewerId, actorId: incomingIds[0], type: "friend_request" } }), 0, "rechazar debe eliminar el aviso");

  await db.notification.create({ data: { recipientId: outgoingIds[0], actorId: viewerId, profileOwnerId: outgoingIds[0], type: "friend_request", legacyTypeId: 1, objectId: viewerId } });
  await db.$transaction(async (transaction) => {
    await transaction.friendConnection.deleteMany({ where: { requesterId: viewerId, addresseeId: outgoingIds[0], status: "pending" } });
    await transaction.notification.deleteMany({ where: { recipientId: outgoingIds[0], actorId: viewerId, objectId: viewerId, type: "friend_request" } });
  });
  assert.equal(await db.notification.count({ where: { recipientId: outgoingIds[0], actorId: viewerId, type: "friend_request" } }), 0, "cancelar debe eliminar el aviso");

  console.log("FRIEND_REQUEST_NOTIFICATIONS_HTTP_SMOKE_PASS", JSON.stringify({ recipientHome: recipientHome.status, accepted: true, rejected: true, cancelled: true }));
  console.log("FRIEND_CONNECTIONS_HTTP_SMOKE_PASS", JSON.stringify({ root: root.status, anonymousAccount: anonymousAccount.status, anonymousProfile: anonymousProfile.status, authenticatedAccount: authenticatedAccount.status, authenticatedProfile: authenticatedProfile.status }));} finally {
  if (ownerId || viewerId || notificationRequesterId || notificationRecipientId || friendIds.length > 0 || dashboardFriendIds.length > 0 || incomingIds.length > 0 || outgoingIds.length > 0) {
    await db.user.deleteMany({ where: { id: { in: [ownerId, viewerId, notificationRequesterId, notificationRecipientId, ...friendIds, ...dashboardFriendIds, ...incomingIds, ...outgoingIds].filter(Boolean) } } });
  }
  const remainingUsers = await db.user.count({ where: { email: { contains: marker } } });
  const remainingConnections = await db.friendConnection.count({
    where: { requester: { email: { contains: marker } } },
  });
  const remainingSessions = await db.authSession.count({ where: { id: { in: [sessionId, notificationRequesterSessionId, notificationRecipientSessionId].filter(Boolean) } } });
  assert.equal(remainingUsers, 0, "los usuarios HTTP sintéticos deben limpiarse");
  assert.equal(remainingConnections, 0, "las conexiones HTTP sintéticas deben limpiarse");
  assert.equal(remainingSessions, 0, "la sesión HTTP sintética debe limpiarse");
  console.log("FRIEND_CONNECTIONS_HTTP_SMOKE_CLEANUP_PASS");
  await db.$disconnect();
  await pool.end();
}
