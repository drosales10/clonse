/**
 * Converts the local asyncpg-style URL to the URL accepted by Prisma/pg.
 * The source value remains in the environment and is never logged.
 */
export function normalizeDatabaseUrl(rawValue: string): string {
  const raw = rawValue.trim().replace(/^['"]|['"]$/g, "");
  const schemeMatch = raw.match(/^(postgresql(?:\+asyncpg)?):\/\/(.*)$/i);
  if (!schemeMatch) {
    throw new Error("DATABASE_URL must use the postgresql:// scheme.");
  }

  const withoutScheme = schemeMatch[2];
  const suffixIndex = withoutScheme.search(/[/?#]/);
  const authority = suffixIndex === -1 ? withoutScheme : withoutScheme.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? "" : withoutScheme.slice(suffixIndex);
  const separator = authority.lastIndexOf("@");
  if (separator < 1) {
    throw new Error("DATABASE_URL must include database credentials.");
  }

  const credentials = authority.slice(0, separator);
  const host = authority.slice(separator + 1);
  const passwordSeparator = credentials.indexOf(":");
  if (passwordSeparator < 1) {
    throw new Error("DATABASE_URL must include a database password.");
  }

  const username = credentials.slice(0, passwordSeparator);
  const password = credentials.slice(passwordSeparator + 1);
  const decodedUsername = decodeURIComponent(username);
  const decodedPassword = decodeURIComponent(password);

  return `postgresql://${encodeURIComponent(decodedUsername)}:${encodeURIComponent(decodedPassword)}@${host}${suffix}`;
}
