import 'dotenv/config';

function required(name, fallback) {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === '') {
    throw new Error(`Missing required env: ${name}`);
  }
  return v;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  corsOrigin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173',
  jwtAccessSecret: required('JWT_ACCESS_SECRET', 'dev_access_secret_change_me_32chars!!'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET', 'dev_refresh_secret_change_me_32chars!'),
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 12),
  databaseUrl: required('DATABASE_URL', 'postgresql://cloudreve:cloudreve@localhost:5432/cloudreve'),
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: Number(process.env.MINIO_PORT || 9000),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
    bucket: process.env.MINIO_BUCKET || 'cloudreve',
    region: process.env.MINIO_REGION || 'us-east-1',
  },
  maxFileSize: Number(process.env.MAX_FILE_SIZE_BYTES || 2 * 1024 ** 3),
  defaultQuota: Number(process.env.DEFAULT_QUOTA_BYTES || 5 * 1024 ** 3),
  adminEmail: process.env.ADMIN_EMAIL || 'admin@cloudreve.local',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin123!',
};
