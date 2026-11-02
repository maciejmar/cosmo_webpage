// Usage:
//   npm run create-admin -- <username>            -> asks for the password
//   npm run create-admin -- <username> --remove   -> deletes the account (its tokens stop working)
// Running it for an existing username changes that account's password.
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { loadConfig } from '../src/config.js';
import { UsersRepository } from '../src/repositories/users.js';

const [username, flag] = process.argv.slice(2);
if (!username) {
  console.error('Usage: npm run create-admin -- <username> [--remove]');
  process.exit(1);
}

const users = new UsersRepository(loadConfig().dataDir);

if (flag === '--remove') {
  const removed = await users.remove(username);
  console.log(removed ? `Removed "${username}".` : `User "${username}" not found.`);
  process.exit(0);
}

const rl = createInterface({ input: stdin, output: stdout });
const password = await rl.question('Password (min. 10 chars): ');
const confirmation = await rl.question('Repeat password: ');
rl.close();

if (password !== confirmation) {
  console.error('Passwords do not match.');
  process.exit(1);
}

try {
  await users.upsert(username, password);
  console.log(`Admin "${username}" saved.`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
