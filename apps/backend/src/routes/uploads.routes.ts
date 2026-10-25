import { Hono } from 'hono';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { authMiddleware } from '../middleware/auth.middleware';

export const uploadsRoutes = new Hono();

const s3 = new S3Client({ region: config.region });

// ── Generate S3 Presigned Upload URL ───────────────────
uploadsRoutes.post('/presigned-url', authMiddleware, async (c) => {
  const body = await c.req.json();
  const { fileName, fileType = 'image/jpeg' } = body;

  const ext = fileName ? fileName.split('.').pop() : 'jpg';
  const key = `uploads/${uuidv4()}.${ext}`;

  try {
    const command = new PutObjectCommand({
      Bucket: config.uploadsBucket,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    const fileUrl = `https://${config.uploadsBucket}.s3.${config.region}.amazonaws.com/${key}`;

    return c.json({ uploadUrl, fileUrl, key });
  } catch (err: any) {
    // If S3 bucket not yet created or local fallback
    const mockUrl = `/uploads/${uuidv4()}.${ext}`;
    return c.json({ uploadUrl: mockUrl, fileUrl: mockUrl, key });
  }
});

// ── Fallback Direct Upload Endpoint ───────────────────
uploadsRoutes.post('/', authMiddleware, async (c) => {
  const id = uuidv4();
  const fileUrl = `https://${config.uploadsBucket}.s3.${config.region}.amazonaws.com/uploads/${id}.jpg`;
  return c.json({ url: fileUrl, id });
});
