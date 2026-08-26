import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import prisma from '../config/prisma.js';
import { UnauthorizedError } from '../utils/errors.js';
import { serializeUser } from '../utils/sanitize.js';

export async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }
    const payload = jwt.verify(header.slice(7), env.jwtAccessSecret);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) throw new UnauthorizedError('User not found');
    req.user = serializeUser(user);
    req.userRaw = user;
    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) return next(err);
    return next(new UnauthorizedError('Invalid or expired token'));
  }
}

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();
  try {
    const payload = jwt.verify(header.slice(7), env.jwtAccessSecret);
    req.user = { id: payload.id, email: payload.email, role: payload.role };
  } catch {
    /* ignore */
  }
  next();
}
