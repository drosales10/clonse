import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const marker = `account_security_http_${Date.now()}`;
const oldPassword = "OldPass123";
const newPassword = "NewPass456";
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });
let userId;
let sessionIds = [];

function hashPassword(password) {
  const salt = randomBytes(16);
  const derivedKey = scryptSync(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

function verifyPassword(password, encodedHash) {
  const [, saltHex, keyHex] = encodedHash.split(":");
  const expected = Buffer.from(keyHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(expected, actual);
}

function decodeHtml(value) {
  return value.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, "&");
}

function formFromPage(html, requiredField) {
  const forms = html.match(/<form[^>]*action=(?:"[^"]*"|'[^']*')[\s\S]*?<\/form>/g) ?? [];
  const formHtml = forms.find((form) => form.includes(`name="${requiredField}"`));
  assert.ok(formHtml, `debe existir el formulario con ${requiredField}`);
  const actionMatch = formHtml.match(/<form[^>]*action=(?:"([^"]*)"|'([^']*)')/);
  assert.ok(actionMatch, `el formulario ${requiredField} debe tener Server Action`);
  const form = new FormData();
  for (const input of formHtml.match(/<input[^>]+>/g) ?? []) {
    const name = input.match(/name="([^"]+)"/)?.[1];
    const value = input.match(/value="([^"]*)"/)?.[1];
    if (name) form.append(name, decodeHtml(value ?? ""));
  }
  return { actionUrl: new URL(actionMatch[1] ?? actionMatch[2] ?? "/account/profile", "http://localhost:3000").toString(), form };
}

async function profileHtml(sessionId) {
  const response = await fetch("http://localhost:3000/account/profile", {
    headers: { Cookie: `social_session=${sessionId}` },
  });
  assert.equal(response.status, 200, "la cuenta debe responder con sesión");
  return response.text();
}

async function postForm(sessionId, actionUrl, form) {
  return fetch(actionUrl, {
    method: "POST",
    headers: { Cookie: `social_session=${sessionId}`, Origin: "http://localhost:3000" },
    body: form,
    redirect: "manual",
  });
}

try {
  const user = await db.user.create({
    data: {
      email: `${marker}@example.invalid`,
      username: marker,
      displayName: "Account Security Smoke",
      passwordHash: hashPassword(oldPassword),
      verifiedAt: new Date(),
    },
    select: { id: true },
  });
  userId = user.id;
  const currentSession = `${marker}_current`;
  const secondarySession = `${marker}_secondary`;
  sessionIds = [currentSession, secondarySession];
  await db.authSession.createMany({
    data: sessionIds.map((id) => ({ id, userId: user.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) })),
  });

  let { actionUrl, form } = formFromPage(await profileHtml(currentSession), "passwordConfirmation");
  form.set("currentPassword", oldPassword);
  form.set("password", newPassword);
  form.set("passwordConfirmation", newPassword);
  const changed = await postForm(currentSession, actionUrl, form);
  assert.equal(changed.status, 200, "cambiar contraseña debe devolver estado de formulario");

  const updated = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  assert.ok(updated && verifyPassword(newPassword, updated.passwordHash), "debe persistir la nueva contraseña");
  assert.equal(verifyPassword(oldPassword, updated.passwordHash), false, "la contraseña anterior no debe seguir siendo válida");
  assert.equal(await db.authSession.count({ where: { id: currentSession } }), 1, "la sesión actual debe conservarse");
  assert.equal(await db.authSession.count({ where: { id: secondarySession } }), 0, "las sesiones restantes deben revocarse");

  ({ actionUrl, form } = formFromPage(await profileHtml(currentSession), "deleteConfirmation"));
  form.set("currentPassword", newPassword);
  form.set("deleteConfirmation", "NO");
  const rejected = await postForm(currentSession, actionUrl, form);
  assert.equal(rejected.status, 200, "una confirmación inválida debe devolver error de formulario");
  assert.equal(await db.user.count({ where: { id: user.id } }), 1, "la confirmación inválida no debe borrar la cuenta");

  ({ actionUrl, form } = formFromPage(await profileHtml(currentSession), "deleteConfirmation"));
  form.set("currentPassword", newPassword);
  form.set("deleteConfirmation", "ELIMINAR");
  const deleted = await postForm(currentSession, actionUrl, form);
  assert.equal(deleted.status, 303, "la eliminación válida debe redirigir");
  assert.equal(await db.user.count({ where: { id: user.id } }), 0, "la cuenta debe eliminarse");
  console.log("ACCOUNT_SECURITY_HTTP_SMOKE_PASS", JSON.stringify({ changed: changed.status, rejected: rejected.status, deleted: deleted.status }));
} finally {
  if (userId) await db.user.deleteMany({ where: { id: userId } });
  await db.authSession.deleteMany({ where: { id: { in: sessionIds } } });
  await db.$disconnect();
  await pool.end();
  console.log("ACCOUNT_SECURITY_HTTP_SMOKE_CLEANUP_PASS");
}
