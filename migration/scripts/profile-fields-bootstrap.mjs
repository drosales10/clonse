import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

/**
 * Idempotent catalog of profile fields for the destination app.
 * Inspired by typical SocialEngine profile groups (About / Personal / Contact),
 * without importing serialized legacy dumps or PII.
 */

function normalizeDatabaseUrl(rawValue) {
  const raw = String(rawValue ?? "")
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/^postgresql\+asyncpg:/i, "postgresql:");
  if (!raw) throw new Error("DATABASE_URL is required");
  return new URL(raw).toString();
}

const categories = [
  {
    key: "about",
    title: "Sobre mí",
    sortOrder: 10,
    fields: [
      {
        fieldKey: "about_me",
        label: "Biografía",
        description: "Cuéntale a la red quién eres.",
        type: "textarea",
        sortOrder: 10,
        required: false,
        maxLength: 1000,
        displayMode: 1,
      },
      {
        fieldKey: "headline",
        label: "Titular",
        description: "Una frase corta que te describa.",
        type: "text",
        sortOrder: 20,
        required: false,
        maxLength: 120,
        displayMode: 1,
      },
    ],
  },
  {
    key: "personal",
    title: "Información personal",
    sortOrder: 20,
    fields: [
      {
        fieldKey: "birthday",
        label: "Fecha de nacimiento",
        description: "Solo se muestra el día y el mes si tu perfil es público.",
        type: "date",
        sortOrder: 10,
        required: false,
        displayMode: 1,
      },
      {
        fieldKey: "gender",
        label: "Género",
        type: "select",
        sortOrder: 20,
        required: false,
        displayMode: 1,
        options: [
          { value: "female", label: "Mujer" },
          { value: "male", label: "Hombre" },
          { value: "non_binary", label: "No binario" },
          { value: "prefer_not", label: "Prefiero no decirlo" },
          { value: "other", label: "Otro" },
        ],
      },
      {
        fieldKey: "relationship",
        label: "Estado sentimental",
        type: "radio",
        sortOrder: 30,
        required: false,
        displayMode: 1,
        options: [
          { value: "single", label: "Soltero/a" },
          { value: "relationship", label: "En una relación" },
          { value: "married", label: "Casado/a" },
          { value: "complicated", label: "Es complicado" },
          { value: "prefer_not", label: "Prefiero no decirlo" },
        ],
      },
      {
        fieldKey: "interests",
        label: "Intereses",
        description: "Marca los temas que te interesan.",
        type: "checkbox",
        sortOrder: 40,
        required: false,
        displayMode: 1,
        options: [
          { value: "music", label: "Música" },
          { value: "sports", label: "Deportes" },
          { value: "travel", label: "Viajes" },
          { value: "tech", label: "Tecnología" },
          { value: "art", label: "Arte" },
          { value: "food", label: "Gastronomía" },
          { value: "reading", label: "Lectura" },
          { value: "games", label: "Juegos" },
        ],
      },
    ],
  },
  {
    key: "contact",
    title: "Contacto y ubicación",
    sortOrder: 30,
    fields: [
      {
        fieldKey: "location",
        label: "Ciudad o ubicación",
        type: "text",
        sortOrder: 10,
        required: false,
        maxLength: 120,
        displayMode: 1,
      },
      {
        fieldKey: "occupation",
        label: "Ocupación",
        type: "text",
        sortOrder: 20,
        required: false,
        maxLength: 120,
        displayMode: 1,
      },
      {
        fieldKey: "website",
        label: "Sitio web",
        description: "URL pública (sin HTML).",
        type: "text",
        sortOrder: 30,
        required: false,
        maxLength: 200,
        displayMode: 2,
      },
    ],
  },
];

const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);
const pool = new Pool({ connectionString: databaseUrl, max: 1 });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });

try {
  let categoryCount = 0;
  let fieldCount = 0;

  for (const category of categories) {
    const existing = await db.profileCategory.findFirst({
      where: { title: category.title, parentId: null },
      select: { id: true },
    });

    const categoryRow = existing
      ? await db.profileCategory.update({
          where: { id: existing.id },
          data: { sortOrder: category.sortOrder, active: true },
          select: { id: true },
        })
      : await db.profileCategory.create({
          data: {
            title: category.title,
            sortOrder: category.sortOrder,
            active: true,
          },
          select: { id: true },
        });
    categoryCount += 1;

    for (const field of category.fields) {
      await db.profileField.upsert({
        where: { fieldKey: field.fieldKey },
        create: {
          categoryId: categoryRow.id,
          fieldKey: field.fieldKey,
          label: field.label,
          description: field.description ?? null,
          type: field.type,
          sortOrder: field.sortOrder,
          required: field.required ?? false,
          maxLength: field.maxLength ?? null,
          options: field.options ?? undefined,
          displayMode: field.displayMode ?? 1,
          validationRegex: null,
          allowHtml: false,
          active: true,
        },
        update: {
          categoryId: categoryRow.id,
          label: field.label,
          description: field.description ?? null,
          type: field.type,
          sortOrder: field.sortOrder,
          required: field.required ?? false,
          maxLength: field.maxLength ?? null,
          options: field.options ?? undefined,
          displayMode: field.displayMode ?? 1,
          validationRegex: null,
          allowHtml: false,
          active: true,
        },
      });
      fieldCount += 1;
    }
  }

  console.log(`profile-fields-bootstrap ok categories=${categoryCount} fields=${fieldCount}`);
} finally {
  await db.$disconnect();
  await pool.end();
}
