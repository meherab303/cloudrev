import prisma from '../config/prisma.js';
import { serializeUser } from '../utils/sanitize.js';
import { parsePagination, paginated } from '../utils/pagination.js';
import { NotFoundError } from '../utils/errors.js';
import * as storage from './storage.service.js';

export async function dashboard(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const [fileCount, folderCount, recent, sharedCount] = await Promise.all([
    prisma.file.count({ where: { userId, isTrashed: false } }),
    prisma.folder.count({ where: { userId, isTrashed: false } }),
    prisma.file.findMany({
      where: { userId, isTrashed: false },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.share.count({ where: { userId } }),
  ]);
  return {
    user: serializeUser(user),
    stats: {
      fileCount,
      folderCount,
      sharedCount,
      storageUsed: Number(user.storageUsed),
      storageQuota: Number(user.storageQuota),
    },
    recentFiles: recent.map((f) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      size: Number(f.size),
      createdAt: f.createdAt,
    })),
  };
}

export async function listUsers(query) {
  const { page, limit, skip } = parsePagination(query);
  const search = query.search;
  const where = search
    ? { email: { contains: search, mode: 'insensitive' } }
    : {};
  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);
  return paginated(rows.map(serializeUser), total, page, limit);
}

export async function updateUser(id, data) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError('User not found');
  const updated = await prisma.user.update({
    where: { id },
    data: {
      role: data.role || undefined,
      storageQuota: data.storageQuota != null ? BigInt(data.storageQuota) : undefined,
      name: data.name ?? undefined,
    },
  });
  return serializeUser(updated);
}

export async function deleteUser(id) {
  const files = await prisma.file.findMany({ where: { userId: id } });
  for (const f of files) {
    await storage.deleteObject(f.objectKey).catch(() => {});
  }
  await prisma.user.delete({ where: { id } });
}

export async function systemStats() {
  const [users, files, storageAgg, shares] = await Promise.all([
    prisma.user.count(),
    prisma.file.count(),
    prisma.user.aggregate({ _sum: { storageUsed: true } }),
    prisma.share.count(),
  ]);
  return {
    users,
    files,
    shares,
    storageUsed: Number(storageAgg._sum.storageUsed || 0),
  };
}

export async function grantPermission({ granterId, userEmail, resourceId, resourceType, canRead, canWrite, canShare }) {
  const target = await prisma.user.findUnique({ where: { email: userEmail.toLowerCase() } });
  if (!target) throw new NotFoundError('User not found');
  const perm = await prisma.permission.upsert({
    where: {
      userId_resourceId_resourceType: {
        userId: target.id,
        resourceId,
        resourceType,
      },
    },
    update: { canRead: canRead !== false, canWrite: !!canWrite, canShare: !!canShare },
    create: {
      userId: target.id,
      resourceId,
      resourceType,
      canRead: canRead !== false,
      canWrite: !!canWrite,
      canShare: !!canShare,
      grantedById: granterId,
    },
  });
  return perm;
}
