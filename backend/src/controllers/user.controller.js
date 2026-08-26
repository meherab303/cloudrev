import * as authService from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const updateMe = asyncHandler(async (req, res) => {
  res.json({ user: await authService.updateProfile(req.user.id, req.body) });
});

export const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
  res.status(204).end();
});
