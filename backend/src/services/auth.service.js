import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/prisma.js';
import { env } from '../config/env.js';
import { redis } from '../config/redis.js';
import {
  AppError, ConflictError, UnauthorizedError, NotFoundError,
} from '../utils/errors.js';
import { serializeUser } from '../utils/sanitize.js';

function signAccess(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.jwtAccessSecret,
    { expiresIn: env.jwtAccessExpires },
  );
}

function refreshExpiryDate() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d;
}

export async function register({ email, password, name }) {
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) throw new ConflictError('Email already registered');
  if (!password || password.length < 8) {
    throw new AppError('Password must be at least 8 characters');
  }
  const passwordHash = await bcrypt.hash(password, env.bcryptRounds);
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      name: name || email.split('@')[0],
      storageQuota: BigInt(env.defaultQuota),
    },
  });
  return issueTokens(user);
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new UnauthorizedError('Invalid credentials');
  }
  return issueTokens(user);
}

export async function issueTokens(user) {
  const accessToken = signAccess(user);
  const refreshToken = crypto.randomBytes(48).toString('hex');
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: refreshExpiryDate(),
    },
  });
  return { accessToken, refreshToken, user: serializeUser(user) };
}

export async function refresh(refreshToken) {
  if (!refreshToken) throw new UnauthorizedError('No refresh token');
  const row = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });
  if (!row || row.expiresAt < new Date()) {
    if (row) await prisma.refreshToken.delete({ where: { id: row.id } }).catch(() => {});
    throw new UnauthorizedError('Invalid refresh token');
  }
  await prisma.refreshToken.delete({ where: { id: row.id } });
  return issueTokens(row.user);
}

export async function logout(refreshToken, accessToken) {
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }
  if (accessToken) {
    try {
      const payload = jwt.decode(accessToken);
      const exp = payload?.exp ? payload.exp - Math.floor(Date.now() / 1000) : 900;
      if (exp > 0) await redis.set(`bl:${accessToken.slice(-32)}`, '1', 'EX', exp);
    } catch {
      /* ignore */
    }
  }
}

export async function me(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');
  return serializeUser(user);
}

export async function changePassword(userId, current, next) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !(await bcrypt.compare(current, user.passwordHash))) {
    throw new UnauthorizedError('Current password is incorrect');
  }
  if (!next || next.length < 8) throw new AppError('Password must be at least 8 characters');
  const passwordHash = await bcrypt.hash(next, env.bcryptRounds);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

export async function updateProfile(userId, { name }) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { name: name ?? undefined },
  });
  return serializeUser(user);
}
