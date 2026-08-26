import Redis from 'ioredis';
import { env } from './env.js';

export const redis = new Redis(env.redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  enableReadyCheck: true,
});

redis.on('error', (err) => {
  console.error('Redis error:', err.message);
});

export async function connectRedis() {
  try {
    await redis.connect();
    console.log('Redis connected');
  } catch (err) {
    console.error('Redis connect failed:', err.message);
  }
}
