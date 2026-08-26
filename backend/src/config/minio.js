import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { env } from './env.js';

export const s3 = new S3Client({
  region: env.minio.region,
  endpoint: `${env.minio.useSSL ? 'https' : 'http'}://${env.minio.endpoint}:${env.minio.port}`,
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.minio.accessKey,
    secretAccessKey: env.minio.secretKey,
  },
});

export const BUCKET = env.minio.bucket;

export async function ensureBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
    console.log(`MinIO bucket created: ${BUCKET}`);
  }
}
