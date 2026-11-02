import express from 'express';
import helmet from 'helmet';
import multer from 'multer';
import { AuditRepository } from './repositories/audit.js';
import { ContentRepository } from './repositories/content.js';
import { UsersRepository } from './repositories/users.js';
import { auditRouter } from './routes/audit.js';
import { authRouter } from './routes/auth.js';
import { contentRouter } from './routes/content.js';
import { uploadsRouter } from './routes/uploads.js';
import { Notifier } from './services/notifier.js';

export function createApp(config, { mailTransport = null } = {}) {
  const deps = {
    config,
    users: new UsersRepository(config.dataDir),
    content: new ContentRepository(config.dataDir),
    audit: new AuditRepository(config.dataDir),
    notifier: new Notifier(config, mailTransport)
  };

  const app = express();
  // Runs behind nginx on the same server: trust X-Forwarded-For only from loopback,
  // so rate limiting and the audit log see the real client IP and it cannot be spoofed directly.
  app.set('trust proxy', 'loopback');
  app.disable('x-powered-by');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-origin' } }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRouter(deps));
  app.use('/api/content', contentRouter(deps));
  app.use('/api/uploads', uploadsRouter(deps));
  app.use('/api/audit', auditRouter(deps));
  app.use('/uploads', express.static(config.uploadsDir, { maxAge: '30d', immutable: true, index: false }));

  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

  // eslint-disable-next-line no-unused-vars
  app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
      const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      return res.status(status).json({ error: error.message });
    }
    if (error.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Request body too large.' });
    }
    if (error.status && error.status < 500) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error(error);
    res.status(500).json({ error: 'Internal server error.' });
  });

  return { app, deps };
}
