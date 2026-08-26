import { Router } from 'express';
import multer from 'multer';
import { env } from '../config/env.js';
import { authMiddleware } from '../middleware/auth.js';
import { uploadLimiter } from '../middleware/rateLimit.js';
import * as ctrl from '../controllers/file.controller.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxFileSize },
});

const router = Router();
router.use(authMiddleware);

router.get('/dashboard', ctrl.getDashboard);
router.get('/', ctrl.list);
router.post('/upload', uploadLimiter, upload.single('file'), ctrl.upload);
router.patch('/:id', ctrl.rename);
router.post('/:id/move', ctrl.move);
router.post('/:id/copy', ctrl.copy);
router.delete('/:id', ctrl.trash);
router.post('/:id/restore', ctrl.restore);
router.delete('/:id/permanent', ctrl.remove);
router.get('/:id/download', ctrl.download);
router.get('/:id/preview', ctrl.preview);

export default router;
