// backend/routes/share.routes.js
import { Router }       from 'express';
import { authMiddleware }   from '../middleware/auth.js';
import { createShare, accessShare } from '../controllers/share.controller.js';

const router = Router();

router.post('/:id',    authMiddleware, createShare); // create link (auth required)
router.get('/:token',  accessShare);                 // access link (public)

export default router;
