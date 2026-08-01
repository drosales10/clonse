import "dotenv/config";
import assert from "node:assert/strict";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const marker = `activity_http_${Date.now()}`;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });
let userIds = [];
let sessionIds = [];

async function createUser(suffix, profilePrivacy = 63) {
  return db.user.create({
    data: {
      email: `${marker}_${suffix}@example.invalid`,
      username: `${marker}_${suffix}`,
      displayName: `Activity ${suffix}`,
      passwordHash: "smoke-only",
      verifiedAt: new Date(),
      profilePrivacy,
    },
    select: { id: true, username: true },
  });
}

function formFromPage(html, values) {
  const match = html.match(/<form[^>]*action=(?:"([^"]*)"|'([^']*)')/);
  assert.ok(match, `la página de ajustes debe exponer la Server Action del formulario: ${html.match(/<form[^>]{0,300}/g)?.join(" | ") ?? "sin formularios"}`);
  const form = new FormData();
  const hiddenInputs = html.match(/<input[^>]+>/g) ?? [];
  for (const input of hiddenInputs) {
    const name = input.match(/name="([^"]+)"/)?.[1];
    const value = decodeHtml(input.match(/value="([^"]*)"/)?.[1] ?? "");
    if (name) form.append(name, value);
  }
  form.set("profilePrivacy", values.profilePrivacy);
  form.set("commentsPrivacy", values.commentsPrivacy);
  form.set("status", values.status);
  const actionPath = match[1] || match[2] || "/account/profile";
  return { actionUrl: new URL(actionPath, "http://localhost:3000/").toString(), form };
}

async function saveStatus(sessionId, status, profileHtml) {
  const { actionUrl, form } = formFromPage(profileHtml, { profilePrivacy: "63", commentsPrivacy: "63", status });
  return fetch(actionUrl, {
    method: "POST",
    headers: { Cookie: `social_session=${sessionId}`, Origin: "http://localhost:3000" },
    body: form,
    redirect: "manual",
  });
}

try {
  const viewer = await createUser("viewer");
  const visibleFriend = await createUser("visible_friend", 3);
  const privateFriend = await createUser("private_friend", 1);
  const blockedFriend = await createUser("blocked_friend");
  userIds = [viewer.id, visibleFriend.id, privateFriend.id, blockedFriend.id];

  await db.friendConnection.createMany({
    data: [
      { requesterId: viewer.id, addresseeId: visibleFriend.id, status: "accepted" },
      { requesterId: viewer.id, addresseeId: privateFriend.id, status: "accepted" },
    ],
  });
  await db.profileBlock.create({ data: { blockerId: viewer.id, blockedId: blockedFriend.id } });
  await db.activity.createMany({
    data: [
      ...Array.from({ length: 11 }, (_, index) => ({
        actorId: visibleFriend.id,
        type: "editstatus",
        text: `Estado visible de conexión ${index}`,
        objectPrivacy: 3,
        createdAt: new Date(Date.now() - (index + 1) * 1000),
      })),
      { actorId: privateFriend.id, type: "editstatus", text: "Estado privado de conexión", objectPrivacy: 1 },
      { actorId: blockedFriend.id, type: "editstatus", text: "Estado bloqueado", objectPrivacy: 63 },
    ],
  });

  const sessionId = `${marker}_viewer_session`;
  sessionIds = [sessionId];
  await db.authSession.create({ data: { id: sessionId, userId: viewer.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
  const viewerHeaders = { Cookie: `social_session=${sessionId}` };

  const root = await fetch("http://localhost:3000/");
  assert.equal(root.status, 200, "la portada debe responder 200");

  const anonymousHome = await fetch("http://localhost:3000/home", { redirect: "manual" });
  assert.equal(anonymousHome.status, 307, "el inicio debe requerir sesión");

  const account = await fetch("http://localhost:3000/account/profile", { headers: viewerHeaders });
  const accountHtml = await account.text();
  assert.equal(account.status, 200, "los ajustes deben responder 200 con sesión");
  const firstSave = await saveStatus(sessionId, "Primer estado HTTP", accountHtml);
  if (![200, 303].includes(firstSave.status)) {
    console.log("ACTIVITY_HTTP_FIRST_SAVE_RESPONSE", firstSave.status, await firstSave.text());
    assert.fail("la Server Action debe aceptar el estado");
  }

  const firstState = await db.user.findUnique({ where: { id: viewer.id }, select: { status: true, statusUpdatedAt: true } });
  assert.equal(firstState?.status, "Primer estado HTTP");
  assert.ok(firstState?.statusUpdatedAt, "el cambio debe guardar statusUpdatedAt");
  assert.equal(await db.activity.count({ where: { actorId: viewer.id, type: "editstatus" } }), 1, "el estado debe publicar una actividad");

  const secondAccount = await fetch("http://localhost:3000/account/profile", { headers: viewerHeaders });
  const secondSave = await saveStatus(sessionId, "Segundo estado HTTP", await secondAccount.text());
  assert.ok([200, 303].includes(secondSave.status), "la segunda Server Action debe aceptar el estado");
  assert.equal(await db.activity.count({ where: { actorId: viewer.id, type: "editstatus" } }), 1, "cambios dentro de 600 segundos deben coalescer");
  assert.equal((await db.activity.findFirst({ where: { actorId: viewer.id, type: "editstatus" } }))?.text, "Segundo estado HTTP");

  const invalidAccount = await fetch("http://localhost:3000/account/profile", { headers: viewerHeaders });
  const invalidSave = await saveStatus(sessionId, "x".repeat(101), await invalidAccount.text());
  assert.equal(invalidSave.status, 200, "la validación del formulario debe devolver un estado estable");
  assert.equal((await db.user.findUnique({ where: { id: viewer.id }, select: { status: true } }))?.status, "Segundo estado HTTP", "un estado demasiado largo no debe mutar la cuenta");
  assert.equal(await db.activity.count({ where: { actorId: viewer.id, type: "editstatus" } }), 1, "un estado inválido no debe publicar actividad");

  const home = await fetch("http://localhost:3000/home", { headers: viewerHeaders });
  const homeHtml = await home.text();
  assert.equal(home.status, 200, "el inicio autenticado debe responder 200");
  assert.match(homeHtml, /Segundo estado HTTP/, "el estado propio debe aparecer en el feed");
  assert.match(homeHtml, /Estado visible de conexión/, "la actividad de una conexión visible debe aparecer");
  assert.equal(homeHtml.includes("Estado privado de conexión"), false, "la actividad privada no debe aparecer");
  assert.equal(homeHtml.includes("Estado bloqueado"), false, "la actividad bloqueada no debe aparecer");
  assert.equal(homeHtml.includes(`${marker}_visible_friend@example.invalid`), false, "el feed no debe mostrar emails de conexiones");
  assert.equal(homeHtml.includes(`${marker}_private_friend@example.invalid`), false, "el feed no debe mostrar emails privados");
  assert.equal((homeHtml.match(/class="activity-item"/g) ?? []).length, 10, "la primera página debe mostrar 10 actividades");

  const secondPage = await fetch("http://localhost:3000/home?activityPage=2", { headers: viewerHeaders });
  const secondPageHtml = await secondPage.text();
  assert.equal(secondPage.status, 200, "la segunda página del feed debe responder 200");
  assert.match(secondPageHtml, /Estado visible de conexión 10/, "la segunda página debe mostrar las actividades restantes");
  assert.equal(secondPageHtml.includes("Segundo estado HTTP"), false, "la segunda página no debe repetir la actividad más reciente");
  assert.equal((secondPageHtml.match(/class="activity-item"/g) ?? []).length, 2, "la segunda página debe mostrar las 2 actividades restantes");

  const normalizedPage = await fetch("http://localhost:3000/home?activityPage=999", { headers: viewerHeaders });
  const normalizedPageHtml = await normalizedPage.text();
  assert.equal(normalizedPage.status, 200, "una página de feed fuera de rango debe responder 200");
  assert.match(normalizedPageHtml, /Estado visible de conexión 10/);
  assert.equal((normalizedPageHtml.match(/class="activity-item"/g) ?? []).length, 2, "la página fuera de rango debe normalizarse a la última");

  await db.activity.updateMany({ where: { actorId: viewer.id, type: "editstatus" }, data: { createdAt: new Date(Date.now() - 601 * 1000) } });
  const boundaryAccount = await fetch("http://localhost:3000/account/profile", { headers: viewerHeaders });
  const boundarySave = await saveStatus(sessionId, "Estado posterior a ventana", await boundaryAccount.text());
  assert.ok([200, 303].includes(boundarySave.status), "el estado posterior a 600 segundos debe aceptarse");
  assert.equal(await db.activity.count({ where: { actorId: viewer.id, type: "editstatus" } }), 2, "fuera de 600 segundos debe crearse otra actividad");

  const clearAccount = await fetch("http://localhost:3000/account/profile", { headers: viewerHeaders });
  const clearSave = await saveStatus(sessionId, "", await clearAccount.text());
  assert.ok([200, 303].includes(clearSave.status), "limpiar el estado debe aceptarse");
  assert.equal((await db.user.findUnique({ where: { id: viewer.id }, select: { status: true } }))?.status, null, "limpiar debe guardar estado nulo");
  assert.equal(await db.activity.count({ where: { actorId: viewer.id, type: "editstatus" } }), 2, "limpiar no debe borrar el historial de actividad");

  console.log("ACTIVITY_STATUS_BOUNDARIES_HTTP_SMOKE_PASS", JSON.stringify({ boundarySave: boundarySave.status, clearSave: clearSave.status, activityCountAfterClear: 2 }));

  console.log("ACTIVITY_HTTP_SMOKE_PASS", JSON.stringify({ root: root.status, anonymousHome: anonymousHome.status, account: account.status, firstSave: firstSave.status, secondSave: secondSave.status, home: home.status }));
} finally {
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  const remainingUsers = await db.user.count({ where: { email: { contains: marker } } });
  const remainingActivities = await db.activity.count({ where: { actor: { email: { contains: marker } } } });
  const remainingBlocks = await db.profileBlock.count({ where: { blocker: { email: { contains: marker } } } });
  const remainingSessions = await db.authSession.count({ where: { id: { in: sessionIds } } });
  assert.equal(remainingUsers, 0, "los usuarios sintéticos deben limpiarse");
  assert.equal(remainingActivities, 0, "las actividades sintéticas deben limpiarse");
  assert.equal(remainingBlocks, 0, "los bloqueos sintéticos deben limpiarse");
  assert.equal(remainingSessions, 0, "las sesiones sintéticas deben limpiarse");
  console.log("ACTIVITY_HTTP_SMOKE_CLEANUP_PASS");
  await db.$disconnect();
  await pool.end();
}

function decodeHtml(value) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}
