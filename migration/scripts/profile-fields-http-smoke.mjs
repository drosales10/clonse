import assert from "node:assert/strict";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const marker = `http_smoke_${Date.now()}`;
const email = `${marker}@example.invalid`;
const username = marker;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });
let userId;

try {
  const user = await db.user.create({
    data: {
      email,
      username,
      displayName: "HTTP Smoke User",
      passwordHash: "smoke-only",
      verifiedAt: new Date(),
      profilePrivacy: 63,
    },
    select: { id: true },
  });
  userId = user.id;

  const root = await fetch("http://localhost:3000/");
  assert.equal(root.status, 200, "la portada debe responder 200");

  const account = await fetch("http://localhost:3000/account/profile", { redirect: "manual" });
  assert.equal(account.status, 307, "la cuenta debe redirigir a login sin sesión");
  assert.match(account.headers.get("location") ?? "", /\/login\?returnUrl=/);

  const profile = await fetch(`http://localhost:3000/profile/${username}`);
  const profileHtml = await profile.text();
  assert.equal(profile.status, 200, "el perfil público sintético debe responder 200");
  assert.match(profileHtml, /HTTP Smoke User/);
  assert.equal(profileHtml.includes(email), false, "el email no debe exponerse en el perfil público");

  console.log("PROFILE_FIELDS_HTTP_SMOKE_PASS", JSON.stringify({ root: root.status, account: account.status, profile: profile.status, emailExposed: false }));
} finally {
  if (userId) await db.user.delete({ where: { id: userId } });
  const remaining = await db.user.count({ where: { email } });
  assert.equal(remaining, 0, "el usuario HTTP sintético debe limpiarse");
  await db.$disconnect();
  await pool.end();
}
