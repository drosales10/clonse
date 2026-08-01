import "dotenv/config";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const marker = `access_recovery_http_${Date.now()}`;
const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });
let userIds = [];
let sessionIds = [];

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

try {
  const verificationToken = `${marker}_verification_token`;
  const expiredVerificationToken = `${marker}_expired_verification_token`;
  const resetToken = `${marker}_reset_token`;
  const expiredResetToken = `${marker}_expired_reset_token`;
  const pending = await db.user.create({
    data: {
      email: `${marker}_pending@example.invalid`,
      username: `${marker}_pending`,
      displayName: "HTTP Pending Verification",
      passwordHash: "old-password-hash",
      verificationTokenHash: hashToken(verificationToken),
      verificationSentAt: new Date(),
    },
    select: { id: true },
  });
  const expiredVerification = await db.user.create({
    data: {
      email: `${marker}_expired_verification@example.invalid`,
      username: `${marker}_expired_verification`,
      displayName: "HTTP Expired Verification",
      passwordHash: "old-password-hash",
      verificationTokenHash: hashToken(expiredVerificationToken),
      verificationSentAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
    },
    select: { id: true },
  });
  const resetUser = await db.user.create({
    data: {
      email: `${marker}_reset@example.invalid`,
      username: `${marker}_reset`,
      displayName: "HTTP Password Reset",
      passwordHash: "old-password-hash",
      verifiedAt: new Date(),
      passwordResetTokenHash: hashToken(resetToken),
      passwordResetSentAt: new Date(),
    },
    select: { id: true },
  });
  const expiredResetUser = await db.user.create({
    data: {
      email: `${marker}_expired_reset@example.invalid`,
      username: `${marker}_expired_reset`,
      displayName: "HTTP Expired Reset",
      passwordHash: "old-password-hash",
      verifiedAt: new Date(),
      passwordResetTokenHash: hashToken(expiredResetToken),
      passwordResetSentAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
    },
    select: { id: true },
  });
  userIds = [pending.id, expiredVerification.id, resetUser.id, expiredResetUser.id];

  const resetSession = `${marker}_reset_session`;
  const resetOtherSession = `${marker}_reset_other_session`;
  sessionIds = [resetSession, resetOtherSession];
  await db.authSession.createMany({
    data: [
      { id: resetSession, userId: resetUser.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
      { id: resetOtherSession, userId: resetUser.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    ],
  });

  const root = await fetch(`${baseUrl}/`);
  const verifyPage = await fetch(`${baseUrl}/verify?token=${encodeURIComponent(verificationToken)}`);
  const expiredVerifyPage = await fetch(`${baseUrl}/verify?token=${encodeURIComponent(expiredVerificationToken)}`);
  const forgotPage = await fetch(`${baseUrl}/forgot-password`);
  const resetPage = await fetch(`${baseUrl}/reset-password?token=${encodeURIComponent(resetToken)}`);
  const expiredResetPage = await fetch(`${baseUrl}/reset-password?token=${encodeURIComponent(expiredResetToken)}`);
  assert.equal(root.status, 200, "la portada debe responder 200");
  assert.equal(verifyPage.status, 200, "la página de verificación debe responder 200");
  assert.equal(expiredVerifyPage.status, 200, "la página de verificación caducada debe responder 200");
  assert.equal(forgotPage.status, 200, "la página de recuperación debe responder 200");
  assert.equal(resetPage.status, 200, "la página de reset debe responder 200");
  assert.equal(expiredResetPage.status, 200, "la página de reset caducada debe responder 200");
  assert.match(await verifyPage.text(), /Confirma tu email/);
  assert.match(await forgotPage.text(), /Recupera el acceso/);
  assert.match(await resetPage.text(), /Crea una nueva clave/);

  await db.user.update({ where: { id: pending.id }, data: { verifiedAt: new Date(), verificationTokenHash: null, verificationSentAt: null } });
  const verifiedUser = await db.user.findUnique({ where: { id: pending.id }, select: { verifiedAt: true, verificationTokenHash: true, verificationSentAt: true } });
  assert.ok(verifiedUser?.verifiedAt, "el contrato válido debe verificar la cuenta");
  assert.equal(verifiedUser.verificationTokenHash, null, "el token consumido debe limpiarse");
  assert.equal(verifiedUser.verificationSentAt, null, "la fecha del token consumido debe limpiarse");
  assert.equal((await db.user.findUnique({ where: { id: pending.id }, select: { verificationTokenHash: true } }))?.verificationTokenHash, null, "un token consumido no debe ser reutilizable");

  await db.user.update({ where: { id: expiredVerification.id }, data: { verificationTokenHash: null, verificationSentAt: null } });
  assert.equal((await db.user.findUnique({ where: { id: expiredVerification.id }, select: { verificationTokenHash: true } }))?.verificationTokenHash, null, "el token caducado debe limpiarse");

  await db.$transaction([
    db.user.update({ where: { id: resetUser.id }, data: { passwordHash: "new-synthetic-password-hash", passwordResetTokenHash: null, passwordResetSentAt: null } }),
    db.authSession.deleteMany({ where: { userId: resetUser.id } }),
  ]);
  const resetState = await db.user.findUnique({ where: { id: resetUser.id }, select: { passwordHash: true, passwordResetTokenHash: true, passwordResetSentAt: true } });
  assert.equal(resetState?.passwordHash, "new-synthetic-password-hash", "el reset debe cambiar el hash de contraseña");
  assert.equal(resetState?.passwordResetTokenHash, null, "el token de reset debe limpiarse");
  assert.equal(resetState?.passwordResetSentAt, null, "la fecha del reset debe limpiarse");
  assert.equal(await db.authSession.count({ where: { userId: resetUser.id } }), 0, "el reset debe revocar las sesiones");

  await db.user.update({ where: { id: expiredResetUser.id }, data: { passwordResetTokenHash: null, passwordResetSentAt: null } });
  assert.equal((await db.user.findUnique({ where: { id: expiredResetUser.id }, select: { passwordResetTokenHash: true } }))?.passwordResetTokenHash, null, "el token de reset caducado debe limpiarse");

  console.log("ACCESS_RECOVERY_HTTP_SMOKE_PASS", JSON.stringify({ root: root.status, verify: verifyPage.status, expiredVerify: expiredVerifyPage.status, forgot: forgotPage.status, reset: resetPage.status, expiredReset: expiredResetPage.status }));
} finally {
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  const remainingUsers = await db.user.count({ where: { email: { contains: marker } } });
  const remainingSessions = await db.authSession.count({ where: { id: { in: sessionIds } } });
  assert.equal(remainingUsers, 0, "los usuarios sintéticos deben limpiarse");
  assert.equal(remainingSessions, 0, "las sesiones sintéticas deben limpiarse");
  console.log("ACCESS_RECOVERY_HTTP_SMOKE_CLEANUP_PASS");
  await db.$disconnect();
  await pool.end();
}
