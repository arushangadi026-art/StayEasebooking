import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { readJson, writeJson, withFileLock } from './storage.ts';
import type { PublicUser } from '../shared/types.ts';

export interface SessionRecord {
  token: string;
  user: PublicUser;
  createdAt: number;
  expiresAt: number;
}

interface StoredAdminConfig {
  email: string;
  passwordHash: string;
  fullName: string;
  claimedAt: string;
}

const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
const sessions = new Map<string, SessionRecord>();

export function createSession(user: PublicUser): SessionRecord {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const record: SessionRecord = {
    token,
    user,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
  };
  sessions.set(token, record);
  return record;
}

export function getSession(token: string | undefined | null): SessionRecord | null {
  if (!token) return null;
  const record = sessions.get(token);
  if (!record) return null;
  if (Date.now() > record.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return record;
}

export function updateSessionUser(userId: string, updatedUser: PublicUser): void {
  for (const [token, session] of sessions.entries()) {
    if (session.user.id === userId) {
      sessions.set(token, { ...session, user: updatedUser });
    }
  }
}

export function deleteSession(token: string | undefined | null): void {
  if (!token) return;
  sessions.delete(token);
}

export function invalidateUserSessions(userId: string): void {
  for (const [token, session] of sessions.entries()) {
    if (session.user.id === userId) {
      sessions.delete(token);
    }
  }
}

function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');
  if (bufA.length !== bufB.length) {
    // Perform dummy comparison to keep timing consistent
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function getAdminSetupStatus(): Promise<{
  configuredViaEnv: boolean;
  isConfigured: boolean;
  adminEmailHint: string | null;
}> {
  const envPass = (process.env.ADMIN_PASSWORD ?? '').trim();
  const envEmail = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase() || 'admin@stayease.in';

  if (envPass.length > 0) {
    return {
      configuredViaEnv: true,
      isConfigured: true,
      adminEmailHint: envEmail,
    };
  }

  const stored = await readJson<StoredAdminConfig | null>('admin.json', null);
  if (stored && stored.passwordHash) {
    return {
      configuredViaEnv: false,
      isConfigured: true,
      adminEmailHint: stored.email,
    };
  }

  return {
    configuredViaEnv: false,
    isConfigured: false,
    adminEmailHint: null,
  };
}

export async function claimFirstRunAdmin(
  email: string,
  password: string,
  fullName: string
): Promise<PublicUser> {
  return withFileLock('admin.json', async () => {
    const envPass = (process.env.ADMIN_PASSWORD ?? '').trim();
    if (envPass.length > 0) {
      throw new Error('Admin credentials are already configured via server environment variables.');
    }

    const existing = await readJson<StoredAdminConfig | null>('admin.json', null);
    if (existing && existing.passwordHash) {
      throw new Error('Admin account has already been initialized.');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 10);
    const config: StoredAdminConfig = {
      email: normalizedEmail,
      passwordHash,
      fullName: fullName.trim() || 'STAYEASE Administrator',
      claimedAt: new Date().toISOString(),
    };
    await writeJson('admin.json', config);

    return {
      id: 'admin_primary',
      fullName: config.fullName,
      email: config.email,
      mobile: '+91 98000 00001',
      role: 'admin',
      isActive: true,
      city: 'Bengaluru',
      createdAt: config.claimedAt,
    };
  });
}

export async function verifyAdminLogin(
  email: string,
  password: string
): Promise<PublicUser | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const envPass = (process.env.ADMIN_PASSWORD ?? '').trim();
  const envEmail = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase() || 'admin@stayease.in';

  // Environment variable admin credentials always take precedence
  if (envPass.length > 0) {
    if (
      normalizedEmail === envEmail &&
      timingSafeEqualString(password, envPass)
    ) {
      return {
        id: 'admin_primary',
        fullName: 'STAYEASE Administrator',
        email: envEmail,
        mobile: '+91 98000 00001',
        role: 'admin',
        isActive: true,
        city: 'Bengaluru',
        createdAt: new Date().toISOString(),
      };
    }
    return null;
  }

  // Fallback to claimed first-run hashed admin stored in data/admin.json
  const stored = await readJson<StoredAdminConfig | null>('admin.json', null);
  if (!stored || !stored.passwordHash) {
    return null;
  }
  if (normalizedEmail !== stored.email) {
    return null;
  }
  const matches = await bcrypt.compare(password, stored.passwordHash);
  if (!matches) {
    return null;
  }
  return {
    id: 'admin_primary',
    fullName: stored.fullName,
    email: stored.email,
    mobile: '+91 98000 00001',
    role: 'admin',
    isActive: true,
    city: 'Bengaluru',
    createdAt: stored.claimedAt,
  };
}
