import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import { env } from '../config/env.js';
import { AppError, NotFoundError, ForbiddenError, UnauthorizedError } from '../utils/errors.js';
import { serializeFile, serializeFolder } from '../utils/sanitize.js';
import { getFileOrThrow } from './file.service.js';
import { getFolderOrThrow } from './folder.service.js';
import * as storage from './storage.service.js';

function expiryFrom(expiry) {
  if (!expiry || expiry === 'never') return null;
  const days = { '1d': 1, '7d': 7, '30d': 30 }[expiry];
  if (!days) return null;
  return new Date(Date.now() + days * 86400000);
}

export async function createShare({ userId, fileId, folderId, expiry, password, maxDownloads }) {
  if (!fileId && !folderId) throw new AppError('fileId or folderId required');
  if (fileId) await getFileOrThrow(fileId, userId);
  if (folderId) await getFolderOrThrow(folderId, userId);
  const token = crypto.randomBytes(8).toString('hex').toUpperCase();
  const passwordHash = password ? await bcrypt.hash(password, env.bcryptRounds) : null;
  const share = await prisma.share.create({
    data: {
      token,
      fileId: fileId || null,
      folderId: folderId || null,
      userId,
      passwordHash,
      expiresAt: expiryFrom(expiry),
      maxDownloads: maxDownloads || null,
    },
  });
  return {
    id: share.id,
    token: share.token,
    link: `/share/${share.token}`,
    expiresAt: share.expiresAt,
  };
}

export async function listShares(userId) {
  const shares = await prisma.share.findMany({
    where: { userId },
    include: { file: true, folder: true },
    orderBy: { createdAt: 'desc' },
  });
  return shares.map((s) => ({
    id: s.id,
    token: s.token,
    link: `/share/${s.token}`,
    expiresAt: s.expiresAt,
    downloadCount: s.downloadCount,
    hasPassword: Boolean(s.passwordHash),
    file: s.file ? serializeFile(s.file) : null,
    folder: s.folder ? serializeFolder(s.folder) : null,
    createdAt: s.createdAt,
  }));
}

export async function revokeShare(id, userId) {
  const share = await prisma.share.findUnique({ where: { id } });
  if (!share) throw new NotFoundError('Share not found');
  if (share.userId !== userId) throw new ForbiddenError('Access denied');
  await prisma.share.delete({ where: { id } });
}

async function resolveShare(token, password) {
  const share = await prisma.share.findUnique({
    where: { token: token.toUpperCase() },
    include: { file: true, folder: true },
  });
  if (!share) throw new NotFoundError('Share link not found');
  if (share.expiresAt && share.expiresAt < new Date()) {
    throw new AppError('Share link has expired', 410);
  }
  if (share.maxDownloads && share.downloadCount >= share.maxDownloads) {
    throw new AppError('Download limit reached', 410);
  }
  if (share.passwordHash) {
    if (!password) throw new UnauthorizedError('Password required');
    const ok = await bcrypt.compare(password, share.passwordHash);
    if (!ok) throw new UnauthorizedError('Wrong password');
  }
  return share;
}

export async function accessShare(token, password) {
  const share = await resolveShare(token, password);
  return {
    token: share.token,
    expiresAt: share.expiresAt,
    file: share.file ? serializeFile(share.file) : null,
    folder: share.folder ? serializeFolder(share.folder) : null,
  };
}

export async function downloadShare(token, password) {
  const share = await resolveShare(token, password);
  if (!share.file) throw new AppError('This share is a folder');
  await prisma.share.update({
    where: { id: share.id },
    data: { downloadCount: { increment: 1 } },
  });
  const obj = await storage.getObject(share.file.objectKey);
  return { file: share.file, body: obj.Body };
}
