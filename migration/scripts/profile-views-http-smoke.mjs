import "dotenv/config";
import assert from "node:assert/strict";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const marker = `profile_views_http_${Date.now()}`;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });
let userIds = [];
let sessionIds = [];

async function createUser(suffix, profilePrivacy = 63, saveProfileViews = true) {
  return db.user.create({
    data: {
      email: `${marker}_${suffix}@example.invalid`,
      username: `${marker}_${suffix}`,
      displayName: `Views ${suffix}`,
      passwordHash: "smoke-only",
      verifiedAt: new Date(),
      profilePrivacy,
      saveProfileViews,
    },
    select: { id: true, username: true },
  });
}

function decodeHtml(value) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function actionFormFromPage(html, text, fallbackPath) {
  const forms = html.match(/<form\b[^>]*>[\s\S]*?<\/form>/g) ?? [];
  const formHtml = forms.find((candidate) => candidate.includes(text));
  assert.ok(formHtml, `no se encontró el formulario con ${text}`);
  const actionMatch = formHtml.match(/<form[^>]*action=(?:"([^"]*)"|'([^']*)')/);
  assert.ok(actionMatch, "el formulario debe exponer una Server Action");
  const form = new FormData();
  for (const input of formHtml.match(/<input[^>]+>/g) ?? []) {
    const name = input.match(/name="([^"]+)"/)?.[1];
    const value = decodeHtml(input.match(/value="([^"]*)"/)?.[1] ?? "");
    if (name) form.append(name, value);
  }
  const actionPath = actionMatch[1] || actionMatch[2] || fallbackPath;
  return { actionUrl: new URL(actionPath, "http://localhost:3000/").toString(), form };
}

try {
  const owner = await createUser("owner");
  const viewer = await createUser("viewer");
  const privateOwner = await createUser("private", 1);
  const noListOwner = await createUser("no_list", 63, false);
  const blockedOwner = await createUser("blocked");
  const userIdsToClean = [owner.id, viewer.id, privateOwner.id, noListOwner.id, blockedOwner.id];
  userIds = userIdsToClean;

  const viewerSession = `${marker}_viewer_session`;
  const ownerSession = `${marker}_owner_session`;
  sessionIds = [viewerSession, ownerSession];
  await db.authSession.createMany({
    data: [
      { id: viewerSession, userId: viewer.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
      { id: ownerSession, userId: owner.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    ],
  });
  await db.profileBlock.create({ data: { blockerId: viewer.id, blockedId: blockedOwner.id } });

  const root = await fetch("http://localhost:3000/");
  assert.equal(root.status, 200, "la portada debe responder 200");

  const anonymousProfile = await fetch(`http://localhost:3000/profile/${owner.username}`);
  const anonymousHtml = await anonymousProfile.text();
  assert.equal(anonymousProfile.status, 200, "el perfil público anónimo debe responder 200");
  assert.match(anonymousHtml, /Visitas/);
  assert.equal((await db.profileViewStats.findUnique({ where: { profileOwnerId: owner.id }, select: { totalViews: true } }))?.totalViews, 1, "el anónimo debe incrementar el contador");
  assert.equal(await db.profileViewViewer.count({ where: { stats: { profileOwnerId: owner.id } } }), 0, "el anónimo no debe aparecer como visitante");

  const viewerHeaders = { Cookie: `social_session=${viewerSession}` };
  const viewerProfile = await fetch(`http://localhost:3000/profile/${owner.username}`, { headers: viewerHeaders });
  assert.equal(viewerProfile.status, 200, "el usuario autenticado debe ver el perfil");
  const viewerProfileAgain = await fetch(`http://localhost:3000/profile/${owner.username}`, { headers: viewerHeaders });
  assert.equal(viewerProfileAgain.status, 200, "la segunda visita debe responder 200");
  const ownerStats = await db.profileViewStats.findUnique({ where: { profileOwnerId: owner.id }, select: { totalViews: true } });
  assert.equal(ownerStats?.totalViews, 3, "cada visita visible debe incrementar el total");
  assert.equal(await db.profileViewViewer.count({ where: { stats: { profileOwnerId: owner.id }, viewerId: viewer.id } }), 1, "el visitante registrado no debe duplicarse");

  const ownProfile = await fetch(`http://localhost:3000/profile/${owner.username}`, { headers: { Cookie: `social_session=${ownerSession}` } });
  assert.equal(ownProfile.status, 200, "el propietario debe poder consultar su perfil");
  assert.equal((await db.profileViewStats.findUnique({ where: { profileOwnerId: owner.id }, select: { totalViews: true } }))?.totalViews, 3, "la visita propia no debe incrementar el total");

  const privateProfile = await fetch(`http://localhost:3000/profile/${privateOwner.username}`);
  assert.equal(privateProfile.status, 200, "el perfil privado debe responder con una superficie estable");
  assert.equal(await db.profileViewStats.count({ where: { profileOwnerId: privateOwner.id } }), 0, "el perfil privado no debe registrar visitas");

  const blockedProfile = await fetch(`http://localhost:3000/profile/${blockedOwner.username}`, { headers: viewerHeaders });
  assert.equal(blockedProfile.status, 200, "el perfil bloqueado debe responder con una superficie estable");
  assert.match(await blockedProfile.text(), /Has bloqueado este perfil|Perfil restringido/);
  assert.equal(await db.profileViewStats.count({ where: { profileOwnerId: blockedOwner.id } }), 0, "el perfil bloqueado no debe registrar visitas");

  const noListProfile = await fetch(`http://localhost:3000/profile/${noListOwner.username}`, { headers: viewerHeaders });
  assert.equal(noListProfile.status, 200, "el perfil con lista desactivada debe responder 200");
  assert.equal((await db.profileViewStats.findUnique({ where: { profileOwnerId: noListOwner.id }, select: { totalViews: true } }))?.totalViews, 1, "desactivar la lista no debe desactivar el contador");
  assert.equal(await db.profileViewViewer.count({ where: { stats: { profileOwnerId: noListOwner.id } } }), 0, "la preferencia debe impedir guardar el visitante");

  const home = await fetch("http://localhost:3000/home", { headers: { Cookie: `social_session=${ownerSession}` } });
  const homeHtml = await home.text();
  assert.equal(home.status, 200, "el inicio autenticado debe responder 200");
  assert.match(homeHtml, /Visitas a tu perfil/);
  assert.match(homeHtml, new RegExp(viewer.username));
  const { actionUrl: resetActionUrl, form: resetForm } = actionFormFromPage(homeHtml, "Reiniciar estadísticas", "/home");
  const resetResponse = await fetch(resetActionUrl, {
    method: "POST",
    headers: { Cookie: `social_session=${ownerSession}`, Origin: "http://localhost:3000" },
    body: resetForm,
    redirect: "manual",
  });
  assert.ok([303, 307].includes(resetResponse.status), "el reinicio debe redirigir al inicio");
  const resetStats = await db.profileViewStats.findUnique({ where: { profileOwnerId: owner.id }, select: { totalViews: true } });
  assert.equal(resetStats?.totalViews, 0, "el reinicio debe poner el contador a cero");
  assert.equal(await db.profileViewViewer.count({ where: { stats: { profileOwnerId: owner.id } } }), 0, "el reinicio debe borrar los visitantes");

  console.log("PROFILE_VIEWS_HTTP_SMOKE_PASS", JSON.stringify({ root: root.status, anonymousProfile: anonymousProfile.status, viewerProfile: viewerProfile.status, privateProfile: privateProfile.status, blockedProfile: blockedProfile.status, reset: resetResponse.status }));
} finally {
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  const remainingUsers = await db.user.count({ where: { email: { contains: marker } } });
  const remainingStats = await db.profileViewStats.count({ where: { profileOwner: { email: { contains: marker } } } });
  const remainingViewers = await db.profileViewViewer.count({ where: { viewer: { email: { contains: marker } } } });
  const remainingBlocks = await db.profileBlock.count({ where: { blocker: { email: { contains: marker } } } });
  const remainingSessions = await db.authSession.count({ where: { id: { in: sessionIds } } });
  assert.equal(remainingUsers, 0, "los usuarios sintéticos deben limpiarse");
  assert.equal(remainingStats, 0, "las estadísticas sintéticas deben limpiarse");
  assert.equal(remainingViewers, 0, "los visitantes sintéticos deben limpiarse");
  assert.equal(remainingBlocks, 0, "los bloqueos sintéticos deben limpiarse");
  assert.equal(remainingSessions, 0, "las sesiones sintéticas deben limpiarse");
  console.log("PROFILE_VIEWS_HTTP_SMOKE_CLEANUP_PASS");
  await db.$disconnect();
  await pool.end();
}
