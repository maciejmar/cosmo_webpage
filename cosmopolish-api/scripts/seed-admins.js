// Non-interactive admin seeding, used by the deploy workflow.
// Reads ADMIN_SEED_B64 = base64(JSON [{ "u": "<username>", "p": "<password>" }, ...]).
// Only creates accounts that do not exist yet - passwords changed later with
// `npm run create-admin` are never overwritten.
import { loadConfig } from '../src/config.js';
import { UsersRepository } from '../src/repositories/users.js';

const encoded = process.env.ADMIN_SEED_B64 ?? '';
if (!encoded) {
  console.log('ADMIN_SEED_B64 not set - skipping admin seeding.');
  process.exit(0);
}

const accounts = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
const users = new UsersRepository(loadConfig().dataDir);

for (const { u: username, p: password } of accounts) {
  if (await users.findByUsername(username)) {
    console.log(`Admin "${username}" already exists - unchanged.`);
    continue;
  }

  try {
    await users.upsert(username, password);
    console.log(`Created admin "${username}".`);
  } catch (error) {
    console.error(`Could not create admin "${username}": ${error.message}`);
    process.exitCode = 1;
  }
}
