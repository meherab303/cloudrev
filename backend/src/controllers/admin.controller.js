import * as userService from '../services/user.service.js';
import { listAuditLogs } from '../services/audit.service.js';
import { parsePagination, paginated } from '../utils/pagination.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const stats = asyncHandler(async (_req, res) => {
  res.json(await userService.systemStats());
});

export const users = asyncHandler(async (req, res) => {
  res.json(await userService.listUsers(req.query));
});

export const updateUser = asyncHandler(async (req, res) => {
  res.json(await userService.updateUser(req.params.id, req.body));
});

export const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id);
  res.status(204).end();
});

export const auditLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { rows, total } = await listAuditLogs({
    page, limit, skip, userId: req.query.userId, action: req.query.action,
  });
  res.json(paginated(rows, total, page, limit));
});

export const grantPermission = asyncHandler(async (req, res) => {
  const perm = await userService.grantPermission({
    granterId: req.user.id,
    userEmail: req.body.email,
    resourceId: req.body.resourceId,
    resourceType: req.body.resourceType,
    canRead: req.body.canRead,
    canWrite: req.body.canWrite,
    canShare: req.body.canShare,
  });
  res.status(201).json(perm);
});
