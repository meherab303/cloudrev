// backend/controllers/file.controller.js
import fs from 'fs';
import path from 'path';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

import {
  createFileMeta,
  getFilesByUser,
  getFileById,
  deleteFileMeta,
} from "../models/file.model.js";

import { addStorageUsed, findById } from "../models/user.model.js";
import { Readable } from "stream";

const MAX_STORAGE = Number(process.env.MAX_STORAGE_BYTES) || 5 * 1024 ** 3;

// ===== AWS S3 CONFIG =====
const BUCKET = process.env.AWS_S3_BUCKET || process.env.S3_BUCKET;
const S3_ENABLED = Boolean(
  BUCKET &&
  process.env.AWS_REGION &&
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY
);

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`;

// GET /api/files
export function listFiles(req, res) {
  const files = getFilesByUser(req.user.id);
  const user = findById(req.user.id);

  return res.json({
    files,
    storageUsed: user?.storageUsed ?? 0,
    storageTotal: MAX_STORAGE,
  });
}

// POST /api/files/upload (S3)
export async function uploadFile(req, res) {
  if (!req.file)
    return res.status(400).json({ error: "No file provided" });

  const user = findById(req.user.id);
  if (!user)
    return res.status(401).json({ error: "User not found" });

  if (user.storageUsed + req.file.size > MAX_STORAGE)
    return res.status(413).json({ error: "Storage limit exceeded" });

  const isS3 = S3_ENABLED;
  const filePath = req.file.path;
  const fileName = req.file.originalname;
  const fileSize = req.file.size;
  const mimeType = req.file.mimetype;

  let fileMeta;

  try {
    if (isS3) {
      const fileKey = `uploads/${req.user.id}/${Date.now()}-${fileName}`;
      const fileStream = fs.createReadStream(filePath);

      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: fileKey,
          Body: fileStream,
          ContentType: mimeType,
        })
      );

      await fs.promises.unlink(filePath).catch(() => {});

      const fileUrl = `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

      fileMeta = createFileMeta({
        userId: req.user.id,
        name: fileName,
        size: fileSize,
        mimeType,
        store: "s3",
        diskPath: fileKey,
        url: fileUrl,
      });
    } else {
      const publicUrl = `${BACKEND_URL}/uploads/${path.basename(filePath)}`;

      fileMeta = createFileMeta({
        userId: req.user.id,
        name: fileName,
        size: fileSize,
        mimeType,
        store: "local",
        diskPath: filePath,
        url: publicUrl,
      });
    }

    addStorageUsed(req.user.id, fileSize);

    return res.status(201).json(fileMeta);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: isS3 ? "S3 upload failed" : "File upload failed",
    });
  }
}

// DELETE /api/files/:id (S3)
export async function deleteFile(req, res) {
  const file = getFileById(req.params.id);

  if (!file)
    return res.status(404).json({ error: "File not found" });

  if (file.userId !== req.user.id)
    return res.status(403).json({ error: "Access denied" });

  try {
    if (file.store === "s3") {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: BUCKET,
          Key: file.diskPath,
        })
      );
    } else {
      await fs.promises.unlink(file.diskPath).catch((err) => {
        if (err.code !== "ENOENT") throw err;
      });
    }

    deleteFileMeta(file.id);
    addStorageUsed(req.user.id, -file.size);

    return res.status(204).end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Delete failed" });
  }
}

// GET /api/files/:id/download (stream from S3)
export async function downloadFile(req, res) {
  const file = getFileById(req.params.id);

  if (!file)
    return res.status(404).json({ error: "File not found" });

  if (file.userId !== req.user.id)
    return res.status(403).json({ error: "Access denied" });

  try {
    if (file.store === "s3") {
      const response = await s3.send(
        new GetObjectCommand({
          Bucket: BUCKET,
          Key: file.diskPath,
        })
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${file.name}"`
      );
      res.setHeader("Content-Type", file.mimeType);

      const stream = Readable.from(response.Body);
      stream.pipe(res);
    } else {
      if (!fs.existsSync(file.diskPath)) {
        return res.status(404).json({ error: "File not found" });
      }

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${file.name}"`
      );
      res.setHeader("Content-Type", file.mimeType || "application/octet-stream");

      fs.createReadStream(file.diskPath).pipe(res);
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Download failed" });
  }
}