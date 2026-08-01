import assert from "node:assert/strict";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

import { profileFieldsFromFormData } from "../../packages/domain/src/profile-fields.ts";

const marker = `smoke_${Date.now()}`;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });

let categoryId;
let firstUserId;
let secondUserId;

function definition(field, categoryTitle) {
  return {
    id: field.id,
    categoryId: field.categoryId,
    categoryTitle,
    parentFieldId: field.parentFieldId,
    fieldKey: field.fieldKey,
    label: field.label,
    description: null,
    type: field.type,
    required: field.required,
    maxLength: field.maxLength,
    options: field.options,
    displayMode: field.displayMode,
    validationRegex: field.validationRegex,
    allowHtml: field.allowHtml,
  };
}

async function main() {
  const firstUser = await db.user.create({
    data: {
      email: `${marker}_one@example.invalid`,
      username: `${marker}_one`,
      displayName: "Smoke One",
      passwordHash: "smoke-only",
      verifiedAt: new Date(),
    },
    select: { id: true },
  });
  firstUserId = firstUser.id;

  const secondUser = await db.user.create({
    data: {
      email: `${marker}_two@example.invalid`,
      username: `${marker}_two`,
      displayName: "Smoke Two",
      passwordHash: "smoke-only",
      verifiedAt: new Date(),
    },
    select: { id: true },
  });
  secondUserId = secondUser.id;

  const category = await db.profileCategory.create({
    data: {
      title: `${marker} category`,
      fields: {
        create: [
          {
            fieldKey: `${marker}_text`,
            label: "Texto",
            type: "text",
            maxLength: 30,
            sortOrder: 1,
          },
          {
            fieldKey: `${marker}_select`,
            label: "Selección",
            type: "select",
            options: [{ value: "a", label: "A" }, { value: "b", label: "B" }],
            sortOrder: 2,
          },
          {
            fieldKey: `${marker}_checkbox`,
            label: "Casillas",
            type: "checkbox",
            options: [{ value: "x", label: "X" }, { value: "y", label: "Y" }],
            sortOrder: 3,
          },
          {
            fieldKey: `${marker}_date`,
            label: "Fecha",
            type: "date",
            sortOrder: 4,
          },
          {
            fieldKey: `${marker}_hidden`,
            label: "Oculto",
            type: "text",
            displayMode: 0,
            sortOrder: 5,
          },
        ],
      },
    },
    include: { fields: { orderBy: { sortOrder: "asc" } } },
  });
  categoryId = category.id;

  const [text, select, checkbox, date, hidden] = category.fields;
  const definitions = category.fields.map((field) => definition(field, category.title));
  const formData = new FormData();
  formData.set(`field_${text.id}`, "Perfil sintético");
  formData.set(`field_${select.id}`, "b");
  formData.append(`field_${checkbox.id}`, "x");
  formData.append(`field_${checkbox.id}`, "y");
  formData.set(`field_${date.id}`, "2026-08-01");
  formData.set(`field_${hidden.id}`, "no debe publicarse");

  const valid = profileFieldsFromFormData(formData, definitions);
  assert.equal(valid.success, true, "los valores válidos deben pasar");
  if (!valid.success) throw new Error("validación sintética inesperadamente inválida");
  assert.deepEqual(valid.values[checkbox.id], ["x", "y"], "checkbox debe conservar un array");

  const invalidFormData = new FormData();
  invalidFormData.set(`field_${select.id}`, "not-allowed");
  const invalid = profileFieldsFromFormData(invalidFormData, definitions);
  assert.equal(invalid.success, false, "una opción no permitida debe rechazarse");
  if (invalid.success) throw new Error("opción inválida aceptada");
  assert.match(invalid.errors[select.id][0], /opción permitida/);

  const values = valid.values;
  await db.$transaction(
    Object.entries(values).map(([fieldId, value]) => db.profileFieldValue.upsert({
      where: { userId_fieldId: { userId: firstUserId, fieldId } },
      create: { userId: firstUserId, fieldId, value },
      update: { value },
    })),
  );

  const firstValues = await db.profileFieldValue.findMany({
    where: { userId: firstUserId },
    select: { fieldId: true, value: true },
  });
  assert.equal(firstValues.length, 5, "el propietario debe tener cinco valores persistidos");
  assert.deepEqual(firstValues.find((item) => item.fieldId === checkbox.id)?.value, ["x", "y"]);

  const secondValues = await db.profileFieldValue.count({ where: { userId: secondUserId } });
  assert.equal(secondValues, 0, "otro usuario no debe recibir valores");

  const publicFields = await db.profileField.findMany({
    where: { categoryId, active: true, displayMode: { not: 0 } },
    select: { id: true },
  });
  assert.equal(publicFields.some((field) => field.id === hidden.id), false, "displayMode=0 debe excluirse del perfil público");
  assert.equal(publicFields.some((field) => field.id === text.id), true, "un campo visible debe permanecer público");

  console.log("PROFILE_FIELDS_SMOKE_PASS", JSON.stringify({ fields: category.fields.length, persisted: firstValues.length, otherUserValues: secondValues }));
}

try {
  await main();
} finally {
  if (firstUserId || secondUserId) {
    await db.user.deleteMany({ where: { id: { in: [firstUserId, secondUserId].filter(Boolean) } } });
  }
  if (categoryId) await db.profileCategory.delete({ where: { id: categoryId } });
  const [remainingUsers, remainingCategories, remainingValues] = await Promise.all([
    db.user.count({ where: { email: { contains: marker } } }),
    db.profileCategory.count({ where: { title: `${marker} category` } }),
    db.profileFieldValue.count({ where: { userId: { in: [firstUserId, secondUserId].filter(Boolean) } } }),
  ]);
  assert.equal(remainingUsers, 0, "los usuarios sintéticos deben limpiarse");
  assert.equal(remainingCategories, 0, "la categoría sintética debe limpiarse");
  assert.equal(remainingValues, 0, "los valores sintéticos deben limpiarse");
  console.log("PROFILE_FIELDS_SMOKE_CLEANUP_PASS");
  await db.$disconnect();
  await pool.end();
}
