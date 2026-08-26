// backend/server.js
// ─────────────────────────────────────────────
// Express app — entry point
// ─────────────────────────────────────────────
import 'dotenv/config';
import express    from 'express';
import cors       from 'cors';
import path       from 'path';
import { fileURLToPath } from 'url';
import fs         from 'fs';

import authRoutes  from './routes/auth.routes.js';
import fileRoutes  from './routes/file.routes.js';
import shareRoutes from './routes/share.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app       = express();
const PORT      = process.env.PORT || 4000;

// ── ensure uploads/ folder exists ─────────────────────────────
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ── Middleware ─────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Serve uploaded files statically ───────────────────────────
app.use('/uploads', express.static(uploadsDir));

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/share', shareRoutes);

// ── Health check ──────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// ── 404 ───────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// ── Global error handler ──────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('❌', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n☁️  Cloudreve Lite backend`);
  console.log(`   http://localhost:${PORT}\n`);
});
