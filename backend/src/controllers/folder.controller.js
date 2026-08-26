import * as folderService from '../services/folder.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logAction } from '../services/audit.service.js';

export const create = asyncHandler(async (req, res) => {
  const folder = await folderService.createFolder({
    userId: req.user.id,
    name: req.body.name,
    parentId: req.body.parentId || null,
  });
  res.status(201).json(folder);
});

export const tree = asyncHandler(async (req, res) => {
  res.json({ folders: await folderService.folderTree(req.user.id) });
});

export const rename = asyncHandler(async (req, res) => {
  res.json(await folderService.renameFolder(req.params.id, req.user.id, req.body.name));
});

export const move = asyncHandler(async (req, res) => {
  res.json(await folderService.moveFolder(req.params.id, req.user.id, req.body.parentId || null));
});

export const trash = asyncHandler(async (req, res) => {
  await folderService.trashFolder(req.params.id, req.user.id);
  await logAction({ userId: req.user.id, action: 'DELETE_FOLDER', resource: req.params.id, req });
  res.status(204).end();
});

export const restore = asyncHandler(async (req, res) => {
  await folderService.restoreFolder(req.params.id, req.user.id);
  res.status(204).end();
});
