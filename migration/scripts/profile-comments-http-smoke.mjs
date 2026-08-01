import "dotenv/config";
import assert from "node:assert/strict";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const marker = `profile_comments_http_${Date.now()}`;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });
let userIds = [];
let sessionIds = [];

async function createUser(suffix, profilePrivacy = 63, commentsPrivacy = 63) {
  return db.user.create({
    data: {
      email: `${marker}_${suffix}@example.invalid`,
      username: `${marker}_${suffix}`,
      displayName: `Comment ${suffix}`,
      passwordHash: "smoke-only",
      verifiedAt: new Date(),
      profilePrivacy,
      commentsPrivacy,
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

function actionFormFromPage(html, requiredField, fallbackPath, secondField = "") {
  const forms = html.match(/<form\b[^>]*>[\s\S]*?<\/form>/g) ?? [];
  const formHtml = forms.find((candidate) => candidate.includes(`name="${requiredField}"`) && (!secondField || candidate.includes(`name="${secondField}"`)));
  assert.ok(formHtml, `no se encontró el formulario con ${requiredField}`);
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

async function postAction(pageHtml, field, path, sessionId, values, secondField = "") {
  const { actionUrl, form } = actionFormFromPage(pageHtml, field, path, secondField);
  for (const [name, value] of Object.entries(values)) form.set(name, value);
  return fetch(actionUrl, {
    method: "POST",
    headers: { Cookie: `social_session=${sessionId}`, Origin: "http://localhost:3000" },
    body: form,
    redirect: "manual",
  });
}

try {
  const owner = await createUser("owner");
  const author = await createUser("author");
  const blockedOwner = await createUser("blocked_owner");
  const privateCommentsOwner = await createUser("private_comments_owner", 63, 1);
  const outsider = await createUser("outsider");
  userIds = [owner.id, author.id, blockedOwner.id, privateCommentsOwner.id, outsider.id];

  await db.profileComment.create({
    data: { profileOwnerId: owner.id, authorId: author.id, body: "Comentario inicial" },
    select: { id: true },
  });
  const blockedSeed = await db.profileComment.create({
    data: { profileOwnerId: blockedOwner.id, authorId: author.id, body: "Comentario oculto por bloqueo" },
    select: { id: true },
  });
  const ownerSession = `${marker}_owner_session`;
  const authorSession = `${marker}_author_session`;
  const outsiderSession = `${marker}_outsider_session`;
  sessionIds = [ownerSession, authorSession, outsiderSession];
  await db.authSession.createMany({
    data: [
      { id: ownerSession, userId: owner.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
      { id: authorSession, userId: author.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
      { id: outsiderSession, userId: outsider.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    ],
  });
  await db.profileBlock.create({ data: { blockerId: author.id, blockedId: blockedOwner.id } });

  const root = await fetch("http://localhost:3000/");
  assert.equal(root.status, 200, "la portada debe responder 200");

  const anonymousProfile = await fetch(`http://localhost:3000/profile/${owner.username}`);
  const anonymousHtml = await anonymousProfile.text();
  assert.equal(anonymousProfile.status, 200, "el perfil público debe responder 200");
  assert.match(anonymousHtml, /Comentario inicial/);
  assert.match(anonymousHtml, /Inicia sesión/);
  assert.equal(anonymousHtml.includes("Escribe un comentario"), false, "el anónimo no debe recibir formulario de alta");

  const authorHeaders = { Cookie: `social_session=${authorSession}` };
  const authorProfileResponse = await fetch(`http://localhost:3000/profile/${owner.username}`, { headers: authorHeaders });
  const authorProfileHtml = await authorProfileResponse.text();
  assert.equal(authorProfileResponse.status, 200, "el autor autenticado debe ver el perfil");
  assert.match(authorProfileHtml, /Escribe un comentario/);
  assert.match(authorProfileHtml, /Editar/);
  assert.match(authorProfileHtml, /Borrar/);

  const createdResponse = await postAction(authorProfileHtml, "body", `/profile/${owner.username}`, authorSession, {
    ownerUsername: owner.username,
    body: "Comentario publicado HTTP",
  });
  assert.equal(createdResponse.status, 200, "la alta debe devolver una respuesta estable");
  const created = await db.profileComment.findFirst({ where: { profileOwnerId: owner.id, authorId: author.id, body: "Comentario publicado HTTP" }, select: { id: true } });
  assert.ok(created, "el comentario publicado debe persistir");

  const authorAfterCreate = await (await fetch(`http://localhost:3000/profile/${owner.username}`, { headers: authorHeaders })).text();
  const updatedResponse = await postAction(authorAfterCreate, "commentId", `/profile/${owner.username}`, authorSession, {
    ownerUsername: owner.username,
    commentId: created.id,
    body: "Comentario editado HTTP",
  }, "body");
  assert.equal(updatedResponse.status, 200, "la edición debe devolver una respuesta estable");
  assert.equal((await db.profileComment.findUnique({ where: { id: created.id }, select: { body: true } }))?.body, "Comentario editado HTTP");

  const outsiderHeaders = { Cookie: `social_session=${outsiderSession}` };
  const outsiderProfileHtml = await (await fetch(`http://localhost:3000/profile/${owner.username}`, { headers: outsiderHeaders })).text();
  assert.equal(outsiderProfileHtml.includes(`name="commentId"`), false, "un tercero no debe recibir controles de borrado");
  const ownerProfileHtml = await (await fetch(`http://localhost:3000/profile/${owner.username}`, { headers: { Cookie: `social_session=${ownerSession}` } })).text();
  const deletedByOwner = await postAction(ownerProfileHtml, "commentId", `/profile/${owner.username}`, ownerSession, {
    ownerUsername: owner.username,
    commentId: created.id,
  });
  assert.equal(deletedByOwner.status, 200, "el propietario debe poder borrar comentarios de su perfil");
  assert.equal(await db.profileComment.count({ where: { id: created.id } }), 0);

  const privateProfile = await fetch(`http://localhost:3000/profile/${privateCommentsOwner.username}`, { headers: authorHeaders });
  const privateHtml = await privateProfile.text();
  assert.equal(privateProfile.status, 200);
  assert.match(privateHtml, /Perfil público/);
  assert.equal(privateHtml.includes("Escribe un comentario"), false, "la máscara de comentarios debe ocultar el formulario");
  const blockedProfile = await fetch(`http://localhost:3000/profile/${blockedOwner.username}`, { headers: authorHeaders });
  const blockedHtml = await blockedProfile.text();
  assert.equal(blockedProfile.status, 200);
  assert.match(blockedHtml, /Perfil restringido|Has bloqueado este perfil/);
  assert.equal(blockedHtml.includes("Comentario oculto por bloqueo"), false, "el bloqueo debe ocultar comentarios");
  assert.equal(await db.profileComment.count({ where: { id: blockedSeed.id } }), 1, "el bloqueo no debe borrar comentarios históricos");

  console.log("PROFILE_COMMENTS_HTTP_SMOKE_PASS", JSON.stringify({ root: root.status, anonymousProfile: anonymousProfile.status, authorProfile: authorProfileResponse.status, created: createdResponse.status, updated: updatedResponse.status, deletedByOwner: deletedByOwner.status, privateProfile: privateProfile.status, blockedProfile: blockedProfile.status }));
} finally {
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  const remainingUsers = await db.user.count({ where: { email: { contains: marker } } });
  const remainingComments = await db.profileComment.count({ where: { profileOwner: { email: { contains: marker } } } });
  const remainingBlocks = await db.profileBlock.count({ where: { blocker: { email: { contains: marker } } } });
  const remainingSessions = await db.authSession.count({ where: { id: { in: sessionIds } } });
  assert.equal(remainingUsers, 0, "los usuarios sintéticos deben limpiarse");
  assert.equal(remainingComments, 0, "los comentarios sintéticos deben limpiarse");
  assert.equal(remainingBlocks, 0, "los bloqueos sintéticos deben limpiarse");
  assert.equal(remainingSessions, 0, "las sesiones sintéticas deben limpiarse");
  console.log("PROFILE_COMMENTS_HTTP_SMOKE_CLEANUP_PASS");
  await db.$disconnect();
  await pool.end();
}
