import "dotenv/config";
import assert from "node:assert/strict";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const marker = `notification_center_http_${Date.now()}`;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });
let userIds = [];

function decodeHtml(value) {
  return value.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, "&");
}

function actionFromPage(html) {
  const formMatch = html.match(/<form[^>]*action=(?:"[^"]*"|'[^']*')[\s\S]*?<\/form>/);
  assert.ok(formMatch, "el centro debe mostrar el formulario de marcado");
  const actionMatch = formMatch[0].match(/<form[^>]*action=(?:"([^"]*)"|'([^']*)')/);
  assert.ok(actionMatch, "el formulario debe incluir Server Action");
  const form = new FormData();
  for (const input of formMatch[0].match(/<input[^>]+>/g) ?? []) {
    const name = input.match(/name="([^"]+)"/)?.[1];
    const value = input.match(/value="([^"]*)"/)?.[1];
    if (name) form.append(name, decodeHtml(value ?? ""));
  }
  return { actionUrl: new URL(actionMatch[1] ?? actionMatch[2] ?? "/account/notifications", "http://localhost:3000").toString(), form };
}

try {
  const owner = await db.user.create({
    data: { email: `${marker}_owner@example.invalid`, username: `${marker}_owner`, displayName: "Notification Owner", passwordHash: "smoke-only", verifiedAt: new Date() },
    select: { id: true },
  });
  const actor = await db.user.create({
    data: { email: `${marker}_actor@example.invalid`, username: `${marker}_actor`, displayName: "Notification Actor", passwordHash: "smoke-only", verifiedAt: new Date() },
    select: { id: true, username: true },
  });
  const disabledActor = await db.user.create({
    data: { email: `${marker}_disabled@example.invalid`, username: `${marker}_disabled`, displayName: "Disabled Actor", passwordHash: "smoke-only", verifiedAt: new Date(), enabled: false },
    select: { id: true },
  });
  userIds = [owner.id, actor.id, disabledActor.id];
  await db.notification.createMany({
    data: [
      { recipientId: owner.id, actorId: actor.id, profileOwnerId: owner.id, type: "profile_comment", legacyTypeId: 3, objectId: owner.id },
      { recipientId: owner.id, actorId: actor.id, profileOwnerId: owner.id, type: "friend_request", legacyTypeId: 1, objectId: actor.id },
      { recipientId: owner.id, actorId: disabledActor.id, profileOwnerId: owner.id, type: "profile_comment", legacyTypeId: 3, objectId: owner.id },
    ],
  });
  const sessionId = `${marker}_session`;
  await db.authSession.create({ data: { id: sessionId, userId: owner.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
  const headers = { Cookie: `social_session=${sessionId}` };
  const page = await fetch("http://localhost:3000/account/notifications", { headers });
  const html = await page.text();
  assert.equal(page.status, 200, "el centro debe responder 200");
  assert.match(html, /Notification Actor/g, "debe mostrar el actor habilitado");
  assert.doesNotMatch(html, /Disabled Actor/g, "no debe mostrar actores deshabilitados");
  assert.match(html, />2<|>2<\/strong>/, "debe mostrar dos avisos no leídos");

  const { actionUrl, form } = actionFromPage(html);
  const marked = await fetch(actionUrl, { method: "POST", headers: { ...headers, Origin: "http://localhost:3000" }, body: form, redirect: "manual" });
  assert.equal(marked.status, 303, "marcar avisos debe redirigir");
  assert.equal(await db.notification.count({ where: { recipientId: owner.id, readAt: null } }), 0, "el marcado debe actualizar los avisos propios de ambos tipos");
  console.log("NOTIFICATION_CENTER_HTTP_SMOKE_PASS", JSON.stringify({ page: page.status, marked: marked.status }));
} finally {
  if (userIds.length) await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
  await pool.end();
  console.log("NOTIFICATION_CENTER_HTTP_SMOKE_CLEANUP_PASS");
}
