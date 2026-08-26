import app from './app.js';
import { env } from './config/env.js';
import { connectRedis } from './config/redis.js';
import { ensureBucket } from './config/minio.js';
import prisma from './config/prisma.js';
import { seedAdmin } from '../prisma/seed.js';

async function start() {
  await connectRedis();
  await ensureBucket();
  await seedAdmin();

  app.listen(env.port, '0.0.0.0', () => {
    console.log(`\n☁️  Cloudreve Lite API`);
    console.log(`   http://localhost:${env.port}`);
    console.log(`   docs: http://localhost:${env.port}/api/docs\n`);
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});

async function shutdown() {
  await prisma.$disconnect().catch(() => {});
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
