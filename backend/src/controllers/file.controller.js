import * as fileService from '../services/file.service.js';
import * as folderService from '../services/folder.service.js';
import { logAction } from '../services/audit.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { dashboard } from '../services/user.service.js';

export const getDashboard = asyncHandler(async (req, res) => {
  res.json(await dashboard(req.user.id));
});

export const list = asyncHandler(async (req, res) => {
  const folderId = req.query.folderId || null;
  const [files, folders, crumbs] = await Promise.all([
    fileService.listFiles({
      userId: req.user.id,
      folderId,
      search: req.query.search,
      sort: req.query.sort,
      order: req.query.order,
      type: req.query.type,
      query: req.query,
    }),
    folderService.listChildren({
      userId: req.user.id,
      parentId: folderId,
      search: req.query.search,
      sort: req.query.sort,
      order: req.query.order,
    }),
    folderService.breadcrumbs(folderId, req.user.id),
  ]);
  res.json({ ...files, folders, breadcrumbs: crumbs });
});

export const upload = asyncHandler(async (req, res) => {
  const file = await fileService.uploadFile({
    user: req.userRaw,
    file: req.file,
    folderId: req.body.folderId || null,
  });
  await logAction({ userId: req.user.id, action: 'UPLOAD', resource: file.id, req, metadata: { name: file.name, size: file.size } });
  res.status(201).json(file);
});

export const rename = asyncHandler(async (req, res) => {
  const file = await fileService.renameFile(req.params.id, req.user.id, req.body.name);
  res.json(file);
});

export const move = asyncHandler(async (req, res) => {
  const file = await fileService.moveFile(req.params.id, req.user.id, req.body.folderId || null);
  res.json(file);
});

export const copy = asyncHandler(async (req, res) => {
  const file = await fileService.copyFile(req.params.id, req.user.id, req.body.folderId);
  await logAction({ userId: req.user.id, action: 'COPY', resource: file.id, req });
  res.status(201).json(file);
});

export const trash = asyncHandler(async (req, res) => {
  await fileService.trashFile(req.params.id, req.user.id);
  await logAction({ userId: req.user.id, action: 'DELETE', resource: req.params.id, req });
  res.status(204).end();
});

export const restore = asyncHandler(async (req, res) => {
  await fileService.restoreFile(req.params.id, req.user.id);
  res.status(204).end();
});

export const remove = asyncHandler(async (req, res) => {
  await fileService.permanentDelete(req.params.id, req.user.id);
  await logAction({ userId: req.user.id, action: 'PERMANENT_DELETE', resource: req.params.id, req });
  res.status(204).end();
});

export const download = asyncHandler(async (req, res) => {
  const { file, body } = await fileService.downloadStream(req.params.id, req.user.id);
  await logAction({ userId: req.user.id, action: 'DOWNLOAD', resource: file.id, req });
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
  res.setHeader('Content-Type', file.mimeType);
  res.setHeader('Content-Length', Number(file.size));
  body.pipe(res);
});

export const preview = asyncHandler(async (req, res) => {
  res.json(await fileService.previewUrl(req.params.id, req.user.id));
});

export const getTrash = asyncHandler(async (req, res) => {
  res.json(await fileService.listTrash({ userId: req.user.id, query: req.query }));
});

export const emptyTrash = asyncHandler(async (req, res) => {
  await fileService.emptyTrash(req.user.id);
  await logAction({ userId: req.user.id, action: 'EMPTY_TRASH', req });
  res.status(204).end();
});
