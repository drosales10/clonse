import { readFile } from "node:fs/promises";
import process from "node:process";

const MAX_INPUT_BYTES = 10 * 1024 * 1024;
const ALLOWED_FIELDS = new Set([
  "sourceSystem",
  "sourceTable",
  "legacyUserId",
  "userId",
  "status",
  "canonicalUserId",
  "reasonCode",
]);
const PII_FIELDS = new Set([
  "email",
  "username",
  "displayName",
  "name",
  "password",
  "passwordHash",
  "token",
  "verificationToken",
  "resetToken",
  "phone",
]);
const STATUSES = new Set(["active", "unresolved", "merged", "excluded"]);

const SELF_CHECK_RECORDS = [
  {
    sourceSystem: "socialengine-3",
    sourceTable: "se_users",
    legacyUserId: 101,
    userId: "synthetic-user-a",
    status: "active",
  },
  {
    sourceSystem: "socialengine-3",
    sourceTable: "se_users",
    legacyUserId: 102,
    userId: "synthetic-user-b",
    status: "merged",
    canonicalUserId: "synthetic-user-c",
  },
  {
    sourceSystem: "socialengine-3",
    sourceTable: "se_users",
    legacyUserId: 0,
    userId: "synthetic-user-invalid",
    status: "active",
  },
  {
    sourceSystem: "socialengine-3",
    sourceTable: "se_users",
    legacyUserId: 103,
    userId: "synthetic-user-d",
    status: "unresolved",
    reasonCode: "missing-destination-user",
  },
];

function emptyReport(source) {
  return {
    mode: "dry-run",
    source,
    records: { total: 0, valid: 0, quarantined: 0, duplicateKeys: 0 },
    byStatus: {},
    byCode: {},
    bySource: {},
    writes: { database: false, files: false, legacy: false },
    privacy: { valuesEmitted: false, piiFieldsRejected: 0 },
  };
}

function increment(map, key) {
  map[key] = (map[key] ?? 0) + 1;
}

function quarantine(report, code) {
  report.records.quarantined += 1;
  increment(report.byCode, code);
  if (code === "pii-field-present") report.privacy.piiFieldsRejected += 1;
}

function validateRecord(record, seenKeys) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return "record-not-object";

  const fields = Object.keys(record);
  if (fields.some((field) => PII_FIELDS.has(field))) return "pii-field-present";
  if (fields.some((field) => !ALLOWED_FIELDS.has(field))) return "unknown-field";

  if (typeof record.sourceSystem !== "string" || record.sourceSystem.trim() === "") return "invalid-source-system";
  if (typeof record.sourceTable !== "string" || record.sourceTable.trim() === "") return "invalid-source-table";
  if (!Number.isInteger(record.legacyUserId) || record.legacyUserId <= 0) return "non-positive-legacy-user-id";
  if (typeof record.userId !== "string" || record.userId.trim() === "") return "missing-destination-user-id";
  if (typeof record.status !== "string" || !STATUSES.has(record.status)) return "invalid-status";

  if (record.status === "merged" && (typeof record.canonicalUserId !== "string" || record.canonicalUserId.trim() === "")) {
    return "merged-without-canonical-user-id";
  }
  if ((record.status === "unresolved" || record.status === "excluded")
    && (typeof record.reasonCode !== "string" || record.reasonCode.trim() === "")) {
    return "inactive-without-reason-code";
  }

  const key = `${record.sourceSystem.trim()}|${record.sourceTable.trim()}|${record.legacyUserId}`;
  if (seenKeys.has(key)) return "duplicate-source-reference";
  seenKeys.add(key);
  return null;
}

function processRecords(records, source) {
  const report = emptyReport(source);
  const seenKeys = new Set();

  for (const record of records) {
    report.records.total += 1;
    const errorCode = validateRecord(record, seenKeys);
    if (errorCode) {
      quarantine(report, errorCode);
      continue;
    }

    report.records.valid += 1;
    increment(report.byStatus, record.status);
    const sourceKey = `${record.sourceSystem.trim()}|${record.sourceTable.trim()}`;
    increment(report.bySource, sourceKey);
  }

  report.records.duplicateKeys = report.byCode["duplicate-source-reference"] ?? 0;
  return report;
}

function parseJsonLines(text) {
  const records = [];
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (line.trim() === "") continue;
    try {
      records.push(JSON.parse(line));
    } catch {
      records.push({ __invalidLine: index + 1 });
    }
  }
  return records;
}

async function readInput(filePath) {
  const contents = await readFile(filePath);
  if (contents.byteLength > MAX_INPUT_BYTES) throw new Error("input-too-large");
  return parseJsonLines(contents.toString("utf8"));
}

function printHelp() {
  process.stdout.write("Uso: pnpm migration:identity:dry-run -- --self-check\n");
  process.stdout.write("Uso: pnpm migration:identity:dry-run -- --input <archivo.jsonl>\n");
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    printHelp();
    return;
  }

  let records;
  let source = "self-check";
  if (args.includes("--self-check")) {
    records = SELF_CHECK_RECORDS;
  } else {
    const inputIndex = args.indexOf("--input");
    const filePath = inputIndex >= 0 ? args[inputIndex + 1] : undefined;
    if (!filePath || filePath.startsWith("--")) throw new Error("input-required");
    source = "jsonl";
    records = await readInput(filePath);
  }

  process.stdout.write(`${JSON.stringify(processRecords(records, source))}\n`);
}

main().catch(() => {
  process.stderr.write("identity-map-dry-run failed\n");
  process.exitCode = 2;
});
