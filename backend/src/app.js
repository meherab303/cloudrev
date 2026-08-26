import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { openapi } from './config/swagger.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import prisma from './config/prisma.js';
import { redis } from './config/redis.js';
import { s3, BUCKET } from './config/minio.js';
import { HeadBucketCommand } from '@aws-sdk/client-s3';

import authRoutes from './routes/auth.routes.js';
import fileRoutes from './routes/file.routes.js';
import folderRoutes from './routes/folder.routes.js';
import shareRoutes from './routes/share.routes.js';
import trashRoutes from './routes/trash.routes.js';
import adminRoutes from './routes/admin.routes.js';
import userRoutes from './routes/user.routes.js';

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: env.corsOrigin.split(',').map((s) => s.trim()),
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/api', apiLimiter);

app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.get('/health/ready', async (_req, res) => {
  const checks = { postgres: false, redis: false, minio: false };
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.postgres = true;
  } catch { /* */ }
  try {
    const pong = await redis.ping();
    checks.redis = pong === 'PONG';
  } catch { /* */ }
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
    checks.minio = true;
  } catch { /* */ }
  const ready = checks.postgres && checks.redis && checks.minio;
  res.status(ready ? 200 : 503).json({ ready, checks });
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi));
app.get('/api/docs.json', (_req, res) => res.json(openapi));

app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/trash', trashRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
