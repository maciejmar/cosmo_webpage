import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

/**
 * Small JSON file store with atomic writes (write to temp file, then rename)
 * and serialized writes, so concurrent saves never corrupt the file.
 * Kept behind repositories, so it can be swapped for a database later.
 */
export class JsonStore {
  #path;
  #fallback;
  #queue = Promise.resolve();

  constructor(path, fallback) {
    this.#path = path;
    this.#fallback = fallback;
  }

  get path() {
    return this.#path;
  }

  async read() {
    try {
      return JSON.parse(await readFile(this.#path, 'utf8'));
    } catch (error) {
      if (error.code === 'ENOENT') {
        return structuredClone(this.#fallback);
      }
      throw error;
    }
  }

  /** Runs `mutate(current)` and persists its result; calls are processed one at a time. */
  update(mutate) {
    const run = this.#queue.then(async () => {
      const next = await mutate(await this.read());
      await this.#write(next);
      return next;
    });
    this.#queue = run.catch(() => {});
    return run;
  }

  async #write(value) {
    await mkdir(dirname(this.#path), { recursive: true });
    const tempPath = `${this.#path}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(tempPath, JSON.stringify(value, null, 2), 'utf8');
    await rename(tempPath, this.#path);
  }
}
