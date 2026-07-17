/**
 * Port of backend/services/r2_storage.py using @aws-sdk/client-s3 (R2 is S3-compatible)
 * and sharp instead of Pillow for image optimization (resize to max width 1200px, re-encode as webp q=80).
 */
const { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const sharp = require('sharp');
const { randomUUID } = require('crypto');

function getR2Client() {
  return new S3Client({
    endpoint: process.env.R2_ENDPOINT,
    region: 'auto',
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

async function optimizeImage(buffer) {
  const img = sharp(buffer).rotate();
  const meta = await img.metadata();
  let pipeline = img.toColorspace('srgb');
  if (meta.width && meta.width > 1200) {
    pipeline = pipeline.resize({ width: 1200 });
  }
  return pipeline.webp({ quality: 80 }).toBuffer();
}

async function uploadImageToR2(fileBuffer, originalFilename, folder = 'properties') {
  try {
    const client = getR2Client();
    const optimized = await optimizeImage(fileBuffer);
    const uniqueName = `${folder}/${randomUUID()}.webp`;
    await client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: uniqueName,
      Body: optimized,
      ContentType: 'image/webp',
    }));
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${uniqueName}`;
    return { success: true, url: publicUrl, filename: uniqueName };
  } catch (e) {
    console.error('R2 upload error:', e);
    return { success: false, url: null, error: e.message };
  }
}

async function uploadRawToR2(buffer, key, contentType) {
  const client = getR2Client();
  await client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

async function deleteImageFromR2(filename) {
  try {
    const client = getR2Client();
    await client.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: filename }));
    return true;
  } catch (e) {
    console.error('R2 delete error:', e);
    return false;
  }
}

async function testR2Connection() {
  try {
    const client = getR2Client();
    const testKey = 'test/connection-test.txt';
    await client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: testKey,
      Body: Buffer.from('ProBroker R2 test file'),
      ContentType: 'text/plain',
    }));
    const listResp = await client.send(new ListObjectsV2Command({ Bucket: process.env.R2_BUCKET_NAME }));
    return {
      connected: true,
      test_url: `${process.env.R2_PUBLIC_URL}/${testKey}`,
      total_objects: listResp.KeyCount || 0,
      bucket: process.env.R2_BUCKET_NAME,
    };
  } catch (e) {
    return { connected: false, error: e.message };
  }
}

async function getR2Stats() {
  try {
    const client = getR2Client();
    const resp = await client.send(new ListObjectsV2Command({ Bucket: process.env.R2_BUCKET_NAME }));
    const objects = resp.Contents || [];
    const totalSize = objects.reduce((sum, o) => sum + (o.Size || 0), 0);
    return {
      total_objects: objects.length,
      total_size_mb: Math.round((totalSize / (1024 * 1024)) * 100) / 100,
      bucket: process.env.R2_BUCKET_NAME,
    };
  } catch (e) {
    return { total_objects: 0, total_size_mb: 0, error: e.message };
  }
}

module.exports = {
  getR2Client,
  uploadImageToR2,
  uploadRawToR2,
  deleteImageFromR2,
  testR2Connection,
  getR2Stats,
};
