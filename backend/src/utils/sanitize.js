const DANGEROUS = new Set([
  'application/x-msdownload',
  'application/x-msdos-program',
]);

export function sanitizeFilename(name = '') {
  const base = name.replace(/[/\\?%*:|"<>]/g, '_').replace(/\0/g, '').trim();
  const cleaned = base.replace(/^\.+/, '').slice(0, 255);
  return cleaned || 'untitled';
}

export function isPathSafe(name) {
  return !name.includes('..') && !name.includes('/') && !name.includes('\\');
}

export function isAllowedMime(mime) {
  if (!mime) return true;
  return !DANGEROUS.has(mime);
}

export function serializeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    storageQuota: Number(user.storageQuota),
    storageUsed: Number(user.storageUsed),
    createdAt: user.createdAt,
  };
}

export function serializeFile(file) {
  if (!file) return null;
  return {
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    size: Number(file.size),
    folderId: file.folderId,
    userId: file.userId,
    isTrashed: file.isTrashed,
    trashedAt: file.trashedAt,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
  };
}

export function serializeFolder(folder) {
  if (!folder) return null;
  return {
    id: folder.id,
    name: folder.name,
    parentId: folder.parentId,
    userId: folder.userId,
    isTrashed: folder.isTrashed,
    trashedAt: folder.trashedAt,
    createdAt: folder.createdAt,
    updatedAt: folder.updatedAt,
  };
}
