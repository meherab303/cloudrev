import prisma from '../config/prisma.js';
import { env } from '../config/env.js';
import { AppError, NotFoundError, ForbiddenError } from '../utils/errors.js';
import { sanitizeFilename, isAllowedMime, serializeFile } from '../utils/sanitize.js';
import { parsePagination, paginated } from '../utils/pagination.js';
import * as storage from './storage.service.js';
import { getFolderOrThrow } from './folder.service.js';

export async function getFileOrThrow(id, userId, { includeTrashed = false } = {}) {
  const file = await prisma.file.findUnique({ where: { id } });
  if (!file || (!includeTrashed && file.isTrashed)) throw new NotFoundError('File not found');
  if (file.userId !== userId) {
    const perm = await prisma.permission.findUnique({
      where: { userId_resourceId_resourceType: { userId, resourceId: id, resourceType: 'FILE' } },
    });
    if (!perm?.canRead) throw new ForbiddenError('Access denied');
  }
  return file;
}

export async function listFiles({ userId, folderId, search, sort, order, type, query }) {
  const { page, limit, skip } = parsePagination(query);
  const where = {
    userId,
    folderId: folderId || null,
    isTrashed: false,
    ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    ...(type ? { mimeType: { startsWith: type } } : {}),
  };
  const allowed = ['name', 'size', 'createdAt', 'mimeType', 'updatedAt'];
  const orderBy = { [allowed.includes(sort) ? sort : 'createdAt']: order === 'asc' ? 'asc' : 'desc' };
  const [rows, total] = await Promise.all([
    prisma.file.findMany({ where, orderBy, skip, take: limit }),
    prisma.file.count({ where }),
  ]);
  return paginated(rows.map(serializeFile), total, page, limit);
}

export async function uploadFile({ user, file, folderId }) {
  if (!file) throw new AppError('No file provided');
  if (!isAllowedMime(file.mimetype)) throw new AppError('File type not allowed', 415);
  if (file.size > env.maxFileSize) throw new AppError('File too large', 413);

  const used = Number(user.storageUsed);
  const quota = Number(user.storageQuota);
  if (used + file.size > quota) throw new AppError('Storage quota exceeded', 413);

  if (folderId) await getFolderOrThrow(folderId, user.id);

  const name = sanitizeFilename(file.originalname);
  const key = storage.objectKey(user.id, name);

  await storage.putObject({
    key,
    body: file.buffer,
    contentType: file.mimetype,
    contentLength: file.size,
  });

  const created = await prisma.$transaction(async (tx) => {
    const row = await tx.file.create({
      data: {
        name,
        mimeType: file.mimetype || 'application/octet-stream',
        size: BigInt(file.size),
        objectKey: key,
        folderId: folderId || null,
        userId: user.id,
      },
    });
    await tx.user.update({
      where: { id: user.id },
      data: { storageUsed: { increment: BigInt(file.size) } },
    });
    return row;
  });

  return serializeFile(created);
}

export async function renameFile(id, userId, name) {
  await getFileOrThrow(id, userId);
  const file = await prisma.file.update({
    where: { id },
    data: { name: sanitizeFilename(name) },
  });
  return serializeFile(file);
}

export async function moveFile(id, userId, folderId) {
  await getFileOrThrow(id, userId);
  if (folderId) await getFolderOrThrow(folderId, userId);
  const file = await prisma.file.update({
    where: { id },
    data: { folderId: folderId || null },
  });
  return serializeFile(file);
}

export async function copyFile(id, userId, folderId) {
  const src = await getFileOrThrow(id, userId);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (Number(user.storageUsed) + Number(src.size) > Number(user.storageQuota)) {
    throw new AppError('Storage quota exceeded', 413);
  }
  if (folderId) await getFolderOrThrow(folderId, userId);
  const destKey = storage.objectKey(userId, src.name);
  await storage.copyObject(src.objectKey, destKey);
  const copy = await prisma.$transaction(async (tx) => {
    const row = await tx.file.create({
      data: {
        name: src.name,
        mimeType: src.mimeType,
        size: src.size,
        objectKey: destKey,
        folderId: folderId ?? src.folderId,
        userId,
      },
    });
    await tx.user.update({
      where: { id: userId },
      data: { storageUsed: { increment: src.size } },
    });
    return row;
  });
  return serializeFile(copy);
}

export async function trashFile(id, userId) {
  await getFileOrThrow(id, userId);
  await prisma.file.update({
    where: { id },
    data: { isTrashed: true, trashedAt: new Date() },
  });
}

export async function restoreFile(id, userId) {
  const file = await getFileOrThrow(id, userId, { includeTrashed: true });
  if (!file.isTrashed) throw new AppError('File is not in trash');
  await prisma.file.update({
    where: { id },
    data: { isTrashed: false, trashedAt: null },
  });
}

export async function permanentDelete(id, userId) {
  const file = await getFileOrThrow(id, userId, { includeTrashed: true });
  await storage.deleteObject(file.objectKey).catch(() => {});
  await prisma.$transaction([
    prisma.file.delete({ where: { id } }),
    prisma.user.update({
      where: { id: userId },
      data: { storageUsed: { decrement: file.size } },
    }),
  ]);
}

export async function downloadStream(id, userId) {
  const file = await getFileOrThrow(id, userId);
  const obj = await storage.getObject(file.objectKey);
  return { file, body: obj.Body, contentType: file.mimeType };
}

export async function previewUrl(id, userId) {
  const file = await getFileOrThrow(id, userId);
  const url = await storage.signedPreviewUrl(file.objectKey, file.mimeType);
  return { url, mimeType: file.mimeType, name: file.name };
}

export async function listTrash({ userId, query }) {
  const { page, limit, skip } = parsePagination(query);
  const fileWhere = { userId, isTrashed: true };
  const folderWhere = { userId, isTrashed: true };
  const [files, fileTotal, folders, folderTotal] = await Promise.all([
    prisma.file.findMany({ where: fileWhere, orderBy: { trashedAt: 'desc' }, skip, take: limit }),
    prisma.file.count({ where: fileWhere }),
    prisma.folder.findMany({ where: folderWhere, orderBy: { trashedAt: 'desc' } }),
    prisma.folder.count({ where: folderWhere }),
  ]);
  return {
    files: files.map(serializeFile),
    folders: folders.map((f) => ({
      id: f.id, name: f.name, parentId: f.parentId, trashedAt: f.trashedAt, createdAt: f.createdAt,
    })),
    pagination: { page, limit, total: fileTotal + folderTotal, totalPages: Math.ceil((fileTotal + folderTotal) / limit) || 1 },
  };
}

export async function emptyTrash(userId) {
  const files = await prisma.file.findMany({ where: { userId, isTrashed: true } });
  let freed = 0n;
  for (const f of files) {
    await storage.deleteObject(f.objectKey).catch(() => {});
    freed += f.size;
  }
  await prisma.$transaction([
    prisma.file.deleteMany({ where: { userId, isTrashed: true } }),
    prisma.folder.deleteMany({ where: { userId, isTrashed: true } }),
    prisma.user.update({
      where: { id: userId },
      data: { storageUsed: { decrement: freed } },
    }),
  ]);
}
