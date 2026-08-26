import prisma from '../config/prisma.js';
import { AppError, NotFoundError, ForbiddenError } from '../utils/errors.js';
import { sanitizeFilename, serializeFolder } from '../utils/sanitize.js';

export async function getFolderOrThrow(id, userId, { includeTrashed = false } = {}) {
  const folder = await prisma.folder.findUnique({ where: { id } });
  if (!folder || (!includeTrashed && folder.isTrashed)) throw new NotFoundError('Folder not found');
  if (folder.userId !== userId) throw new ForbiddenError('Access denied');
  return folder;
}

export async function createFolder({ userId, name, parentId }) {
  const clean = sanitizeFilename(name);
  if (parentId) await getFolderOrThrow(parentId, userId);
  const existing = await prisma.folder.findFirst({
    where: { userId, parentId: parentId || null, name: clean, isTrashed: false },
  });
  if (existing) throw new AppError('A folder with that name already exists here');
  const folder = await prisma.folder.create({
    data: { name: clean, parentId: parentId || null, userId },
  });
  return serializeFolder(folder);
}

export async function listChildren({ userId, parentId, search, sort = 'name', order = 'asc' }) {
  const where = {
    userId,
    parentId: parentId || null,
    isTrashed: false,
    ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
  };
  const allowed = ['name', 'createdAt', 'updatedAt'];
  const orderBy = { [allowed.includes(sort) ? sort : 'name']: order === 'desc' ? 'desc' : 'asc' };
  const folders = await prisma.folder.findMany({ where, orderBy });
  return folders.map(serializeFolder);
}

export async function folderTree(userId) {
  const folders = await prisma.folder.findMany({
    where: { userId, isTrashed: false },
    orderBy: { name: 'asc' },
  });
  return folders.map(serializeFolder);
}

export async function renameFolder(id, userId, name) {
  await getFolderOrThrow(id, userId);
  const folder = await prisma.folder.update({
    where: { id },
    data: { name: sanitizeFilename(name) },
  });
  return serializeFolder(folder);
}

async function collectDescendantIds(id) {
  const children = await prisma.folder.findMany({ where: { parentId: id }, select: { id: true } });
  const ids = [id];
  for (const c of children) {
    ids.push(...await collectDescendantIds(c.id));
  }
  return ids;
}

export async function moveFolder(id, userId, parentId) {
  await getFolderOrThrow(id, userId);
  if (parentId) {
    await getFolderOrThrow(parentId, userId);
    const descendants = await collectDescendantIds(id);
    if (descendants.includes(parentId)) {
      throw new AppError('Cannot move a folder into itself or a descendant');
    }
  }
  const folder = await prisma.folder.update({
    where: { id },
    data: { parentId: parentId || null },
  });
  return serializeFolder(folder);
}

export async function trashFolder(id, userId) {
  await getFolderOrThrow(id, userId);
  const ids = await collectDescendantIds(id);
  const now = new Date();
  await prisma.$transaction([
    prisma.folder.updateMany({
      where: { id: { in: ids }, userId },
      data: { isTrashed: true, trashedAt: now },
    }),
    prisma.file.updateMany({
      where: { folderId: { in: ids }, userId },
      data: { isTrashed: true, trashedAt: now },
    }),
  ]);
}

export async function restoreFolder(id, userId) {
  const folder = await getFolderOrThrow(id, userId, { includeTrashed: true });
  if (!folder.isTrashed) throw new AppError('Folder is not in trash');
  const ids = await collectDescendantIds(id);
  await prisma.$transaction([
    prisma.folder.updateMany({
      where: { id: { in: ids }, userId },
      data: { isTrashed: false, trashedAt: null },
    }),
    prisma.file.updateMany({
      where: { folderId: { in: ids }, userId },
      data: { isTrashed: false, trashedAt: null },
    }),
  ]);
}

export async function breadcrumbs(folderId, userId) {
  if (!folderId) return [];
  const crumbs = [];
  let current = await getFolderOrThrow(folderId, userId);
  while (current) {
    crumbs.unshift({ id: current.id, name: current.name });
    if (!current.parentId) break;
    current = await prisma.folder.findUnique({ where: { id: current.parentId } });
    if (!current || current.userId !== userId) break;
  }
  return crumbs;
}

export { collectDescendantIds };
