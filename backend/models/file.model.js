// backend/models/file.model.js
// ─────────────────────────────────────────────
// In-memory file metadata store.
// Replace with Mongoose/Prisma for production.
// ─────────────────────────────────────────────

const files = new Map(); // id → fileMeta

export function createFileMeta({ userId, name, size, mimeType, store, diskPath, url }) {
  const file = {
    id:         crypto.randomUUID(),
    userId,
    name,
    size,
    mimeType,
    store,       // 'local' | 's3'
    diskPath,    // absolute path on disk (local) or S3 key
    url,         // public download URL
    shared:      null,
    uploadedAt:  Date.now(),
  };
  files.set(file.id, file);
  return file;
}

export function getFilesByUser(userId) {
  return [...files.values()].filter(f => f.userId === userId);
}

export function getFileById(id) {
  return files.get(id) ?? null;
}

export function deleteFileMeta(id) {
  return files.delete(id);
}

export function setSharedLink(id, link) {
  const f = files.get(id);
  if (f) f.shared = link;
  return f;
}
