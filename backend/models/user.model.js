// backend/models/user.model.js
// ─────────────────────────────────────────────
// In-memory user store.
// Replace with Mongoose/Prisma for production.
// ─────────────────────────────────────────────
import bcrypt from 'bcryptjs';

const users = new Map(); // email → user

export async function createUser(email, password, defaultStore = 'local') {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id:           crypto.randomUUID(),
    email,
    passwordHash,
    defaultStore,
    storageUsed:  0,
    createdAt:    Date.now(),
  };
  users.set(email, user);
  return user;
}

export function findByEmail(email) {
  return users.get(email) ?? null;
}

export function findById(id) {
  for (const u of users.values()) if (u.id === id) return u;
  return null;
}

export async function verifyPassword(user, password) {
  return bcrypt.compare(password, user.passwordHash);
}

export function addStorageUsed(id, bytes) {
  const u = findById(id);
  if (u) u.storageUsed = Math.max(0, u.storageUsed + bytes);
}

export function safeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}
