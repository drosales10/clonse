import { mkdir, writeFile, readFile, access, unlink } from "node:fs/promises";
import path from "node:path";

function storageRoot(): string {
  const configured = process.env.ALBUM_STORAGE_DIR?.trim();
  if (configured) return path.resolve(configured);
  return path.resolve(process.cwd(), "storage", "albums");
}

export function albumMediaAbsolutePath(storageKey: string): string {
  const root = storageRoot();
  const resolved = path.resolve(root, storageKey);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    throw new Error("Invalid album storage key");
  }
  return resolved;
}

export async function writeAlbumMediaFile(
  storageKey: string,
  bytes: Buffer,
): Promise<void> {
  const absolute = albumMediaAbsolutePath(storageKey);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, bytes);
}

export async function readAlbumMediaFile(storageKey: string): Promise<Buffer | null> {
  try {
    const absolute = albumMediaAbsolutePath(storageKey);
    await access(absolute);
    return readFile(absolute);
  } catch {
    return null;
  }
}

export function buildAlbumStorageKey(albumId: string, mediaId: string, extension: string): string {
  const safeExt = extension.replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin";
  return `${albumId}/${mediaId}.${safeExt}`;
}

export async function deleteAlbumMediaFile(storageKey: string): Promise<void> {
  try {
    const absolute = albumMediaAbsolutePath(storageKey);
    await unlink(absolute);
  } catch {
    // ignore missing files
  }
}
