import * as shareService from '../services/share.service.js';
import { logAction } from '../services/audit.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const create = asyncHandler(async (req, res) => {
  const share = await shareService.createShare({
    userId: req.user.id,
    fileId: req.body.fileId,
    folderId: req.body.folderId,
    expiry: req.body.expiry,
    password: req.body.password,
    maxDownloads: req.body.maxDownloads,
  });
  await logAction({ userId: req.user.id, action: 'SHARE', resource: share.token, req });
  res.status(201).json(share);
});

export const list = asyncHandler(async (req, res) => {
  res.json({ shares: await shareService.listShares(req.user.id) });
});

export const revoke = asyncHandler(async (req, res) => {
  await shareService.revokeShare(req.params.id, req.user.id);
  res.status(204).end();
});

export const access = asyncHandler(async (req, res) => {
  const password = req.query.password || req.body?.password;
  res.json(await shareService.accessShare(req.params.token, password));
});

export const download = asyncHandler(async (req, res) => {
  const password = req.query.password || req.body?.password;
  const { file, body } = await shareService.downloadShare(req.params.token, password);
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
  res.setHeader('Content-Type', file.mimeType);
  body.pipe(res);
});
