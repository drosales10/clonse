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
let sessionId;

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

  await db.friendConnection.createMany({
    data: [
      { requesterId: viewerId, addresseeId: ownerId, status: "accepted" },
      ...friendIds.map((friendId) => ({ requesterId: friendId, addresseeId: ownerId, status: "accepted" })),
    ],
  });
  sessionId = `${marker}_session`;
  await db.authSession.create({ data: { id: sessionId, userId: viewerId, expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });

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
  assert.match(accountHtml, /HTTP Friends Owner/);
  assert.equal(accountHtml.includes(`${marker}_owner@example.invalid`), false, "la cuenta de conexiones no debe mostrar email");

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

  console.log("FRIEND_CONNECTIONS_HTTP_SMOKE_PASS", JSON.stringify({ root: root.status, anonymousAccount: anonymousAccount.status, anonymousProfile: anonymousProfile.status, authenticatedAccount: authenticatedAccount.status, authenticatedProfile: authenticatedProfile.status }));
} finally {
  if (ownerId || viewerId || friendIds.length > 0) {
    await db.user.deleteMany({ where: { id: { in: [ownerId, viewerId, ...friendIds].filter(Boolean) } } });
  }
  const remainingUsers = await db.user.count({ where: { email: { contains: marker } } });
  const remainingConnections = await db.friendConnection.count({
    where: { requester: { email: { contains: marker } } },
  });
  const remainingSessions = await db.authSession.count({ where: { id: sessionId ?? "missing" } });
  assert.equal(remainingUsers, 0, "los usuarios HTTP sintéticos deben limpiarse");
  assert.equal(remainingConnections, 0, "las conexiones HTTP sintéticas deben limpiarse");
  assert.equal(remainingSessions, 0, "la sesión HTTP sintética debe limpiarse");
  console.log("FRIEND_CONNECTIONS_HTTP_SMOKE_CLEANUP_PASS");
  await db.$disconnect();
  await pool.end();
}
