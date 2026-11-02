// Usage: npm run revoke-sessions
// Generates a new JWT_SECRET in .env and reloads the API, so every issued token stops working
// immediately and all admins have to log in again. Use it when an account may be compromised.
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { setEnvValues } from './env-file.js';

const envPath = resolve(import.meta.dirname, '..', '.env');
setEnvValues(envPath, { JWT_SECRET: randomBytes(48).toString('base64url') });
console.log('New JWT_SECRET written to .env.');

try {
  execFileSync('pm2', ['reload', 'cosmopolish-api', '--update-env'], { stdio: 'inherit', shell: process.platform === 'win32' });
  console.log('API reloaded - all sessions revoked.');
} catch {
  console.error('Could not reload via pm2. Restart the API manually: pm2 reload cosmopolish-api --update-env');
  process.exit(1);
}
