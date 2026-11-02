import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const envPath = resolve(projectRoot, '.env');

if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

function resolveDir(value, fallback) {
  return resolve(projectRoot, value || fallback);
}

export function loadConfig(overrides = {}) {
  const env = { ...process.env, ...overrides };
  const jwtSecret = env.JWT_SECRET ?? '';

  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be set and have at least 32 characters.');
  }

  return {
    port: Number(env.PORT) || 3001,
    host: env.HOST || '127.0.0.1',
    jwtSecret,
    jwtExpiresIn: env.JWT_EXPIRES_IN || '8h',
    dataDir: resolveDir(env.DATA_DIR, './data'),
    uploadsDir: resolveDir(env.UPLOADS_DIR, './uploads'),
    maxUploadBytes: (Number(env.MAX_UPLOAD_MB) || 8) * 1024 * 1024,
    siteUrl: env.SITE_URL || 'https://cosmopolish.mathe.pl',
    // E-mail alerts are disabled when SMTP_HOST or ALERT_EMAIL_TO is empty.
    smtp: {
      host: env.SMTP_HOST || '',
      port: Number(env.SMTP_PORT) || 587,
      secure: env.SMTP_SECURE === 'true',
      user: env.SMTP_USER || '',
      pass: env.SMTP_PASS || '',
      from: env.MAIL_FROM || env.SMTP_USER || ''
    },
    alertEmails: (env.ALERT_EMAIL_TO ?? '')
      .split(',')
      .map((address) => address.trim())
      .filter(Boolean),
    seedAdmin: {
      username: (env.ADMIN_USERNAME ?? '').trim(),
      password: env.ADMIN_PASSWORD ?? ''
    }
  };
}
