// backend/routes/file.routes.js
import { Router } from 'express';
import multer     from 'multer';
import path       from 'path';
import { fileURLToPath } from 'url';
import { authMiddleware }  from '../middleware/auth.js';
import {
  listFiles, uploadFile,
  deleteFile, downloadFile,
} from '../controllers/file.controller.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Multer config — saves to backend/uploads/ ──────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) =>
    cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const ext    = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2 GB max
});

const router = Router();

router.get('/',                  authMiddleware, listFiles);
router.post('/upload',           authMiddleware, upload.single('file'), uploadFile);
router.get('/:id/download',      authMiddleware, downloadFile);
router.delete('/:id',            authMiddleware, deleteFile);

export default router;
