import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as ctrl from '../controllers/share.controller.js';

const router = Router();

router.get('/public/:token', ctrl.access);
router.get('/public/:token/download', ctrl.download);
router.post('/public/:token', ctrl.access);

router.get('/', authMiddleware, ctrl.list);
router.post('/', authMiddleware, ctrl.create);
router.delete('/:id', authMiddleware, ctrl.revoke);

export default router;
