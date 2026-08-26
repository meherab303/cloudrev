// backend/controllers/share.controller.js
import { getFileById, setSharedLink } from '../models/file.model.js';
import fs from 'fs';

// token → { fileId, expiresAt, password }
const shareTokens = new Map();

function calcExpiry(expiry) {
  if (expiry === 'never') return null;
  const days = { '1d': 1, '7d': 7, '30d': 30 }[expiry] ?? 7;
  return Date.now() + days * 86_400_000;
}

// POST /api/share/:id
export function createShare(req, res) {
  const { expiry = '7d', password = '' } = req.body;
  const file = getFileById(req.params.id);

  if (!file)
    return res.status(404).json({ error: 'File not found' });
  if (file.userId !== req.user.id)
    return res.status(403).json({ error: 'Access denied' });

  const token     = crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
  const expiresAt = calcExpiry(expiry);

  shareTokens.set(token, { fileId: file.id, expiresAt, password });
  setSharedLink(file.id, token);

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const link    = `${baseUrl}/api/share/${token}`;

  return res.json({ token, link, expiresAt });
}

// GET /api/share/:token  — public access
export function accessShare(req, res) {
  const { token }    = req.params;
  const { password } = req.query;
  const share        = shareTokens.get(token);

  if (!share)
    return res.status(404).json({ error: 'Share link not found' });

  if (share.expiresAt && Date.now() > share.expiresAt) {
    shareTokens.delete(token);
    return res.status(410).json({ error: 'Share link has expired' });
  }

  if (share.password && share.password !== password)
    return res.status(401).json({ error: 'Wrong password' });

  const file = getFileById(share.fileId);
  if (!file)
    return res.status(404).json({ error: 'File no longer exists' });

  res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
  res.setHeader('Content-Type', file.mimeType);
  fs.createReadStream(file.diskPath).pipe(res);
}
