import { Router } from 'express';
import { body } from 'express-validator';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as ctrl from '../controllers/user.controller.js';

const router = Router();
router.use(authMiddleware);

router.patch('/me', body('name').optional().isString().trim(), validate, ctrl.updateMe);
router.patch(
  '/me/password',
  body('currentPassword').isString().notEmpty(),
  body('newPassword').isLength({ min: 8 }),
  validate,
  ctrl.changePassword,
);

export default router;
