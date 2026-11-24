import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { getSession } from '../services/authStore.ts';
import type { PublicUser } from '../shared/types.ts';

export interface AuthenticatedRequest extends Request {
  user?: PublicUser;
  authToken?: string;
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const token = header.slice(7).trim();
    if (token.length > 0) return token;
  }
  return null;
}

export function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const token = extractBearerToken(req);
  const session = getSession(token);
  if (session) {
    req.user = session.user;
    req.authToken = session.token;
  }
  next();
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const token = extractBearerToken(req);
  const session = getSession(token);
  if (!session) {
    res.status(401).json({ error: 'Authentication required. Please sign in to continue.' });
    return;
  }
  if (!session.user.isActive) {
    res.status(403).json({ error: 'Your account access is currently suspended. Contact STAYEASE support.' });
    return;
  }
  req.user = session.user;
  req.authToken = session.token;
  next();
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Administrator privileges are required for this action.' });
      return;
    }
    next();
  });
}

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts from this address. Please wait a few minutes and try again.',
  },
});

export const registerRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many registration requests. Please try again shortly.',
  },
});
