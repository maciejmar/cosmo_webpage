import { appendFile, mkdir, readFile, rename, stat } from 'node:fs/promises';
import { join } from 'node:path';

const MAX_LOG_BYTES = 5 * 1024 * 1024;

/**
 * Append-only audit log (one JSON object per line) in data/audit.log.
 * When it grows past 5 MB it is renamed to audit-<timestamp>.log and a new file is started.
 */
export class AuditRepository {
  #dataDir;
  #path;
  #queue = Promise.resolve();

  constructor(dataDir) {
    this.#dataDir = dataDir;
    this.#path = join(dataDir, 'audit.log');
  }

  /** Never throws - a failing audit write must not break the request that triggered it. */
  record(event, { req, username = null, details = {} } = {}) {
    const entry = {
      at: new Date().toISOString(),
      event,
      username,
      ip: req ? clientIp(req) : null,
      userAgent: req?.get('user-agent')?.slice(0, 300) ?? null,
      details
    };

    this.#queue = this.#queue
      .then(() => this.#append(entry))
      .catch((error) => console.error('Audit log write failed:', error));
    return this.#queue;
  }

  /** Newest first. */
  async list({ limit = 200 } = {}) {
    let content;
    try {
      content = await readFile(this.#path, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }

    return content
      .split('\n')
      .filter(Boolean)
      .slice(-limit)
      .reverse()
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }

  async #append(entry) {
    await mkdir(this.#dataDir, { recursive: true });
    try {
      if ((await stat(this.#path)).size > MAX_LOG_BYTES) {
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        await rename(this.#path, join(this.#dataDir, `audit-${stamp}.log`));
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    await appendFile(this.#path, `${JSON.stringify(entry)}\n`, 'utf8');
  }
}

/** Client IP as seen by nginx (X-Forwarded-For is trusted only from loopback, see app.js). */
export function clientIp(req) {
  return (req.ip ?? '').replace(/^::ffff:/, '') || null;
}
