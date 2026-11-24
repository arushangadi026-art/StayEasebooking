import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export type DataFileName =
  | 'users.json'
  | 'hotels.json'
  | 'rooms.json'
  | 'bookings.json'
  | 'reviews.json'
  | 'messages.json'
  | 'eventRegistrations.json'
  | 'admin.json';

const ALLOWED_FILES = new Set<DataFileName>([
  'users.json',
  'hotels.json',
  'rooms.json',
  'bookings.json',
  'reviews.json',
  'messages.json',
  'eventRegistrations.json',
  'admin.json',
]);

export const DATA_DIR = path.resolve(process.cwd(), 'data');

const fileLocks = new Map<string, Promise<unknown>>();

function resolveSafeDataPath(filename: DataFileName): string {
  if (!ALLOWED_FILES.has(filename)) {
    throw new Error(`Disallowed data file requested: ${filename}`);
  }
  const resolved = path.resolve(DATA_DIR, filename);
  if (!resolved.startsWith(DATA_DIR + path.sep)) {
    throw new Error('Invalid file path outside data directory.');
  }
  return resolved;
}

export async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function dataFileExists(filename: DataFileName): Promise<boolean> {
  const filePath = resolveSafeDataPath(filename);
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readJson<T>(filename: DataFileName, fallback: T): Promise<T> {
  await ensureDataDir();
  const filePath = resolveSafeDataPath(filename);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    if (!raw.trim()) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === 'ENOENT') {
      return fallback;
    }
    console.error(`[Storage] Failed reading ${filename}, returning fallback:`, err);
    return fallback;
  }
}

export async function writeJson<T>(filename: DataFileName, data: T): Promise<void> {
  await ensureDataDir();
  const filePath = resolveSafeDataPath(filename);
  const serialized = JSON.stringify(data, null, 2);
  const tempPath = `${filePath}.${crypto.randomBytes(6).toString('hex')}.tmp`;
  await fs.writeFile(tempPath, serialized, 'utf-8');
  await fs.rename(tempPath, filePath);
}

/**
 * Serializes read-modify-write operations on a specific JSON file to avoid lost updates.
 */
export async function withFileLock<T>(
  filename: DataFileName,
  task: () => Promise<T>
): Promise<T> {
  const previous = fileLocks.get(filename) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  const chained = previous.then(() => current);
  fileLocks.set(filename, chained);

  await previous;
  try {
    return await task();
  } finally {
    release();
    if (fileLocks.get(filename) === chained) {
      fileLocks.delete(filename);
    }
  }
}

export function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
}
