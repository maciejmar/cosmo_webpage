import bcrypt from 'bcryptjs';
import { join } from 'node:path';
import { JsonStore } from '../storage/json-store.js';

const BCRYPT_ROUNDS = 12;
const MAX_KNOWN_IPS = 50;
// Compared against when the user does not exist, so response time does not reveal valid usernames.
const DUMMY_HASH = bcrypt.hashSync('timing-safe-dummy-password', BCRYPT_ROUNDS);

export function normalizeUsername(username) {
  return String(username ?? '').trim().toLowerCase();
}

export class UsersRepository {
  #store;

  constructor(dataDir) {
    this.#store = new JsonStore(join(dataDir, 'users.json'), { users: [] });
  }

  async findByUsername(username) {
    const normalized = normalizeUsername(username);
    const { users } = await this.#store.read();
    return users.find((user) => user.username === normalized) ?? null;
  }

  async count() {
    const { users } = await this.#store.read();
    return users.length;
  }

  /** Creates the user or replaces the password of an existing one. */
  async upsert(username, password, role = 'admin') {
    const normalized = normalizeUsername(username);
    if (!normalized) {
      throw new Error('Username is required.');
    }
    if (String(password).length < 10) {
      throw new Error('Password must have at least 10 characters.');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const now = new Date().toISOString();

    await this.#store.update((data) => {
      const existing = data.users.find((user) => user.username === normalized);
      if (existing) {
        Object.assign(existing, { passwordHash, role, updatedAt: now });
      } else {
        data.users.push({ username: normalized, passwordHash, role, createdAt: now, updatedAt: now });
      }
      return data;
    });
  }

  /**
   * Remembers the IP of a successful login. Returns true when the account has never
   * logged in from this IP before (used for "login from a new IP" e-mail alerts).
   */
  async registerLoginIp(username, ip) {
    const normalized = normalizeUsername(username);
    const now = new Date().toISOString();
    let isNew = false;

    await this.#store.update((data) => {
      const user = data.users.find((candidate) => candidate.username === normalized);
      if (!user) {
        return data;
      }

      user.knownIps ??= [];
      const known = user.knownIps.find((entry) => entry.ip === ip);
      if (known) {
        known.lastSeen = now;
      } else {
        isNew = true;
        user.knownIps.push({ ip, firstSeen: now, lastSeen: now });
        user.knownIps = user.knownIps.slice(-MAX_KNOWN_IPS);
      }
      return data;
    });

    return isNew;
  }

  async remove(username) {
    const normalized = normalizeUsername(username);
    let removed = false;
    await this.#store.update((data) => {
      const before = data.users.length;
      data.users = data.users.filter((user) => user.username !== normalized);
      removed = data.users.length !== before;
      return data;
    });
    return removed;
  }

  async verifyCredentials(username, password) {
    const user = await this.findByUsername(username);
    const matches = await bcrypt.compare(String(password ?? ''), user?.passwordHash ?? DUMMY_HASH);
    return user && matches ? user : null;
  }
}
