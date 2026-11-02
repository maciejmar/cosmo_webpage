import { Router } from 'express';
import multer from 'multer';
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { requireAuth } from '../middleware/auth.js';

// Detected from file bytes, not from the client-provided name or MIME type.
// SVG is intentionally not allowed (it can carry scripts).
const IMAGE_SIGNATURES = [
  { ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: 'png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: 'gif', test: (b) => b.subarray(0, 4).toString('ascii') === 'GIF8' },
  { ext: 'webp', test: (b) => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP' }
];

function detectImageExtension(buffer) {
  return IMAGE_SIGNATURES.find((signature) => buffer.length >= 12 && signature.test(buffer))?.ext ?? null;
}

export function uploadsRouter(deps) {
  const { config, audit } = deps;
  const router = Router();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: config.maxUploadBytes, files: 1 }
  });

  router.post('/images', requireAuth(deps), upload.single('image'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided (field "image").' });
    }

    const ext = detectImageExtension(req.file.buffer);
    if (!ext) {
      return res.status(415).json({ error: 'Only JPG, PNG, GIF and WebP images are allowed.' });
    }

    const fileName = `${Date.now()}-${randomBytes(8).toString('hex')}.${ext}`;
    await mkdir(config.uploadsDir, { recursive: true });
    await writeFile(join(config.uploadsDir, fileName), req.file.buffer);
    audit.record('upload.image', {
      req,
      username: req.user.username,
      details: { file: fileName, bytes: req.file.size, originalName: req.file.originalname?.slice(0, 200) }
    });

    res.status(201).json({ url: `/uploads/${fileName}` });
  });

  return router;
}
