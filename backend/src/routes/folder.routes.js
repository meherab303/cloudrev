import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as ctrl from '../controllers/folder.controller.js';

const router = Router();
router.use(authMiddleware);

router.post('/', ctrl.create);
router.get('/tree', ctrl.tree);
router.patch('/:id', ctrl.rename);
router.post('/:id/move', ctrl.move);
router.delete('/:id', ctrl.trash);
router.post('/:id/restore', ctrl.restore);

export default router;
