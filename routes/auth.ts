import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { readJson, writeJson, withFileLock, generateId } from '../services/storage.ts';
import {
  createSession,
  deleteSession,
  updateSessionUser,
  verifyAdminLogin,
  getAdminSetupStatus,
  claimFirstRunAdmin,
} from '../services/authStore.ts';
import {
  requireAuth,
  loginRateLimiter,
  registerRateLimiter,
  type AuthenticatedRequest,
} from '../middleware/auth.ts';
import type { User, PublicUser } from '../shared/types.ts';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[+\d][\d\s-]{8,16}$/;

function toPublicUser(user: User): PublicUser {
  const { passwordHash: _ignored, ...pub } = user;
  return pub;
}

router.get('/admin-status', async (_req, res) => {
  try {
    const status = await getAdminSetupStatus();
    res.json(status);
  } catch (err) {
    console.error('[Auth] admin-status error:', err);
    res.status(500).json({ error: 'Unable to check admin status.' });
  }
});

router.post('/admin-setup', registerRateLimiter, async (req, res) => {
  try {
    const { email, password, confirmPassword, fullName } = req.body ?? {};
    if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
      res.status(400).json({ error: 'Please enter a valid administrator email address.' });
      return;
    }
    if (typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ error: 'Administrator password must be at least 8 characters long.' });
      return;
    }
    if (password !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match.' });
      return;
    }

    const adminUser = await claimFirstRunAdmin(
      email,
      password,
      typeof fullName === 'string' ? fullName : 'STAYEASE Administrator'
    );
    const session = createSession(adminUser);
    res.status(201).json({
      message: 'Administrator account initialized successfully.',
      token: session.token,
      user: adminUser,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to initialize admin account.';
    res.status(409).json({ error: message });
  }
});

router.post('/register', registerRateLimiter, async (req, res) => {
  try {
    const { fullName, email, mobile, password, confirmPassword, city } = req.body ?? {};

    if (typeof fullName !== 'string' || fullName.trim().length < 2) {
      res.status(400).json({ error: 'Please enter your full name (at least 2 characters).' });
      return;
    }
    if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }
    if (typeof mobile !== 'string' || !MOBILE_RE.test(mobile.trim())) {
      res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number.' });
      return;
    }
    if (typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      res.status(400).json({ error: 'Password and confirm password do not match.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const created = await withFileLock('users.json', async () => {
      const users = await readJson<User[]>('users.json', []);
      const exists = users.some((u) => u.email.toLowerCase() === normalizedEmail);
      if (exists) {
        return null;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const newUser: User = {
        id: generateId('usr'),
        fullName: fullName.trim().slice(0, 100),
        email: normalizedEmail,
        mobile: mobile.trim().slice(0, 20),
        passwordHash,
        role: 'customer',
        isActive: true,
        city: typeof city === 'string' && city.trim() ? city.trim().slice(0, 60) : 'Bengaluru',
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      await writeJson('users.json', users);
      return toPublicUser(newUser);
    });

    if (!created) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const session = createSession(created);
    res.status(201).json({
      message: 'Registration successful! Welcome to STAYEASE.',
      token: session.token,
      user: created,
    });
  } catch (err) {
    console.error('[Auth] register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

router.post('/login', loginRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    // 1. Check Admin login first
    const adminUser = await verifyAdminLogin(email, password);
    if (adminUser) {
      const session = createSession(adminUser);
      res.json({
        message: 'Signed in as STAYEASE Administrator.',
        token: session.token,
        user: adminUser,
      });
      return;
    }

    // 2. Check Customer account in users.json
    const normalizedEmail = email.trim().toLowerCase();
    const users = await readJson<User[]>('users.json', []);
    const matched = users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!matched) {
      res.status(401).json({ error: 'Invalid email address or password.' });
      return;
    }

    const validPassword = await bcrypt.compare(password, matched.passwordHash);
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid email address or password.' });
      return;
    }

    if (!matched.isActive) {
      res.status(403).json({
        error: 'Your account has been suspended by the administrator. Please contact support.',
      });
      return;
    }

    const pubUser = toPublicUser(matched);
    const session = createSession(pubUser);
    res.json({
      message: `Welcome back, ${pubUser.fullName}.`,
      token: session.token,
      user: pubUser,
    });
  } catch (err) {
    console.error('[Auth] login error:', err);
    res.status(500).json({ error: 'Unable to sign in right now.' });
  }
});

router.post('/logout', requireAuth, (req: AuthenticatedRequest, res) => {
  deleteSession(req.authToken);
  res.json({ message: 'You have been signed out safely.' });
});

router.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

router.put('/profile', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user || req.user.role === 'admin') {
      res.status(400).json({ error: 'Admin profile is managed via server configuration.' });
      return;
    }

    const { fullName, mobile, city } = req.body ?? {};
    if (typeof fullName !== 'string' || fullName.trim().length < 2) {
      res.status(400).json({ error: 'Full name must be at least 2 characters.' });
      return;
    }
    if (typeof mobile !== 'string' || !MOBILE_RE.test(mobile.trim())) {
      res.status(400).json({ error: 'Please provide a valid mobile number.' });
      return;
    }

    const updated = await withFileLock('users.json', async () => {
      const users = await readJson<User[]>('users.json', []);
      const idx = users.findIndex((u) => u.id === req.user!.id);
      if (idx === -1) return null;

      users[idx] = {
        ...users[idx],
        fullName: fullName.trim().slice(0, 100),
        mobile: mobile.trim().slice(0, 20),
        city: typeof city === 'string' ? city.trim().slice(0, 60) : users[idx].city,
      };
      await writeJson('users.json', users);
      return toPublicUser(users[idx]);
    });

    if (!updated) {
      res.status(404).json({ error: 'Customer profile not found.' });
      return;
    }

    updateSessionUser(updated.id, updated);
    res.json({ message: 'Profile updated successfully.', user: updated });
  } catch (err) {
    console.error('[Auth] profile update error:', err);
    res.status(500).json({ error: 'Unable to update profile.' });
  }
});

export default router;
