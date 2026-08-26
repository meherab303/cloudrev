import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';
import { s3, BUCKET } from '../config/minio.js';
import { sanitizeFilename } from '../utils/sanitize.js';

export function objectKey(userId, filename) {
  return `${userId}/${uuid()}-${sanitizeFilename(filename)}`;
}

export async function putObject({ key, body, contentType, contentLength }) {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    ContentLength: contentLength,
  }));
}

export async function getObject(key) {
  return s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
}

export async function deleteObject(key) {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export async function copyObject(srcKey, destKey) {
  await s3.send(new CopyObjectCommand({
    Bucket: BUCKET,
    CopySource: `${BUCKET}/${srcKey}`,
    Key: destKey,
  }));
}

export async function signedGetUrl(key, filename, expiresIn = 300) {
  const cmd = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${sanitizeFilename(filename)}"`,
  });
  return getSignedUrl(s3, cmd, { expiresIn });
}

export async function signedPreviewUrl(key, mimeType, expiresIn = 300) {
  const cmd = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ResponseContentType: mimeType,
  });
  return getSignedUrl(s3, cmd, { expiresIn });
}
