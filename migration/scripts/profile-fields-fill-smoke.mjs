import "dotenv/config";
import assert from "node:assert/strict";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

import {
  formatProfileFieldDisplayValue,
  profileFieldsFromFormData,
} from "../../packages/domain/src/profile-fields.ts";

function normalizeDatabaseUrl(rawValue) {
  const raw = String(rawValue ?? "")
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/^postgresql\+asyncpg:/i, "postgresql:");
  return new URL(raw).toString();
}

const pool = new Pool({ connectionString: normalizeDatabaseUrl(process.env.DATABASE_URL), max: 1 });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });

try {
  const user = await db.user.findFirst({
    where: { enabled: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, username: true },
  });
  assert.ok(user, "Need at least one user");

  const fields = await db.profileField.findMany({
    where: { active: true, parentFieldId: null, category: { active: true } },
    include: { category: { select: { title: true, sortOrder: true } } },
    orderBy: [{ sortOrder: "asc" }],
  });
  assert.ok(fields.length >= 9, `Expected seeded fields, got ${fields.length}`);

  const definitions = fields.map((field) => ({
    id: field.id,
    categoryId: field.categoryId,
    categoryTitle: field.category.title,
    parentFieldId: field.parentFieldId,
    fieldKey: field.fieldKey,
    label: field.label,
    description: field.description,
    type: field.type,
    required: field.required,
    maxLength: field.maxLength,
    options: Array.isArray(field.options) ? field.options : [],
    displayMode: field.displayMode,
    validationRegex: field.validationRegex,
    allowHtml: field.allowHtml,
  }));

  const formData = new FormData();
  const about = definitions.find((item) => item.fieldKey === "about_me");
  const gender = definitions.find((item) => item.fieldKey === "gender");
  const interests = definitions.find((item) => item.fieldKey === "interests");
  assert.ok(about && gender && interests);

  formData.set(`field_${about.id}`, "Biografía de prueba del smoke.");
  formData.set(`field_${gender.id}`, "prefer_not");
  formData.append(`field_${interests.id}`, "music");
  formData.append(`field_${interests.id}`, "tech");

  const validation = profileFieldsFromFormData(formData, definitions);
  assert.equal(validation.success, true);

  for (const [fieldId, value] of Object.entries(validation.values)) {
    if (value === null) {
      await db.profileFieldValue.deleteMany({ where: { userId: user.id, fieldId } });
      continue;
    }
    await db.profileFieldValue.upsert({
      where: { userId_fieldId: { userId: user.id, fieldId } },
      create: { userId: user.id, fieldId, value },
      update: { value },
    });
  }

  const saved = await db.profileFieldValue.findMany({
    where: { userId: user.id, fieldId: { in: [about.id, gender.id, interests.id] } },
    include: { field: { select: { type: true, options: true, fieldKey: true } } },
  });
  assert.equal(saved.length, 3);

  const genderDisplay = formatProfileFieldDisplayValue(
    "select",
    "prefer_not",
    gender.options,
  );
  assert.equal(genderDisplay, "Prefiero no decirlo");

  console.log(`profile-fields-fill-smoke ok user=${user.username} saved=${saved.length}`);
} finally {
  await db.$disconnect();
  await pool.end();
}
