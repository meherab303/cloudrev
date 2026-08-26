import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import * as ctrl from '../controllers/admin.controller.js';

const router = Router();
router.use(authMiddleware, adminMiddleware);

router.get('/stats', ctrl.stats);
router.get('/users', ctrl.users);
router.patch('/users/:id', ctrl.updateUser);
router.delete('/users/:id', ctrl.deleteUser);
router.get('/audit-logs', ctrl.auditLogs);
router.post('/permissions', ctrl.grantPermission);

export default router;
