import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as ctrl from '../controllers/file.controller.js';

const router = Router();
router.use(authMiddleware);
router.get('/', ctrl.getTrash);
router.delete('/', ctrl.emptyTrash);

export default router;
