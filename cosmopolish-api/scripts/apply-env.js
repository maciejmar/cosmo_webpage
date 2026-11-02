// Used by the deploy workflow: APPLY_ENV_B64 = base64(JSON { KEY: value, ... }).
// Writes the given settings (e.g. SMTP from GitHub Secrets) into .env. Empty values are skipped,
// so settings edited manually on the server stay unless the secret is set.
import { resolve } from 'node:path';
import { setEnvValues } from './env-file.js';

const ALLOWED_KEYS = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM', 'ALERT_EMAIL_TO', 'SITE_URL'];

const encoded = process.env.APPLY_ENV_B64 ?? '';
if (!encoded) {
  console.log('APPLY_ENV_B64 not set - .env unchanged.');
  process.exit(0);
}

const values = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
const updates = Object.fromEntries(
  Object.entries(values).filter(([key, value]) => ALLOWED_KEYS.includes(key) && value !== '' && value != null)
);

setEnvValues(resolve(import.meta.dirname, '..', '.env'), updates);
console.log(`Updated .env keys: ${Object.keys(updates).join(', ') || '(none)'}`);
