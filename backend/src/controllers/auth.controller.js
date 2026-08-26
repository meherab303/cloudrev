import { body } from 'express-validator';
import * as authService from '../services/auth.service.js';
import { logAction } from '../services/audit.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const registerRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be 8+ characters'),
  body('name').optional().isString().trim().isLength({ max: 80 }),
];

export const loginRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').isString().notEmpty(),
];

const cookieOpts = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  await logAction({ userId: result.user.id, action: 'REGISTER', req });
  res.cookie('refreshToken', result.refreshToken, cookieOpts);
  res.status(201).json({ token: result.accessToken, user: result.user });
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  await logAction({ userId: result.user.id, action: 'LOGIN', req });
  res.cookie('refreshToken', result.refreshToken, cookieOpts);
  res.json({ token: result.accessToken, user: result.user });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  const result = await authService.refresh(token);
  res.cookie('refreshToken', result.refreshToken, cookieOpts);
  res.json({ token: result.accessToken, user: result.user });
});

export const logout = asyncHandler(async (req, res) => {
  const header = req.headers.authorization;
  await authService.logout(req.cookies?.refreshToken, header?.startsWith('Bearer ') ? header.slice(7) : null);
  await logAction({ userId: req.user?.id, action: 'LOGOUT', req });
  res.clearCookie('refreshToken', { path: '/' });
  res.status(204).end();
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.me(req.user.id);
  res.json({ user });
});
