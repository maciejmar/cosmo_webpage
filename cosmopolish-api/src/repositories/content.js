import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';
import { JsonStore } from '../storage/json-store.js';

const MAX_VERSIONS = 200;
const VERSION_ID_PATTERN = /^[0-9TZ-]+-[0-9a-f]{6}$/;

/**
 * Stores the whole localized site content as one JSON document:
 * { languages: { en: {...}, pl: {...} }, updatedAt, updatedBy }.
 * The shape of each language is owned by the frontend, so new sections
 * and material types do not require backend changes.
 *
 * Every save also writes a version snapshot (data/versions/<id>.json) and an entry in
 * data/versions/index.json, so earlier states of a language can be restored.
 */
export class ContentRepository {
  #store;
  #versionsDir;
  #versionIndex;
  #drafts;

  constructor(dataDir) {
    this.#store = new JsonStore(join(dataDir, 'content.json'), { languages: {}, updatedAt: null, updatedBy: null });
    this.#versionsDir = join(dataDir, 'versions');
    this.#versionIndex = new JsonStore(join(this.#versionsDir, 'index.json'), { versions: [] });
    // Unpublished edits from the admin panel, one shared draft per language (data/drafts.json).
    this.#drafts = new JsonStore(join(dataDir, 'drafts.json'), { drafts: {} });
  }

  read() {
    return this.#store.read();
  }

  /**
   * Publishing (or restoring) a language also clears its draft - the draft was based on
   * the content that has just been replaced.
   *
   * @param meta { username, ip, action: 'save' | 'restore', restoredFrom? }
   */
  async saveLanguage(language, content, meta) {
    const saved = await this.#store.update((data) => ({
      ...data,
      languages: { ...data.languages, [language]: content },
      updatedAt: new Date().toISOString(),
      updatedBy: meta.username
    }));

    await this.#recordVersion(language, content, saved.updatedAt, meta);
    await this.deleteDraft(language);
    return saved;
  }

  /** { content, savedAt, savedBy } or null. */
  async getDraft(language) {
    const { drafts } = await this.#drafts.read();
    return drafts[language] ?? null;
  }

  async saveDraft(language, content, username) {
    const draft = { content, savedAt: new Date().toISOString(), savedBy: username };
    await this.#drafts.update((data) => ({ drafts: { ...data.drafts, [language]: draft } }));
    return draft;
  }

  async deleteDraft(language) {
    await this.#drafts.update((data) => {
      const drafts = { ...data.drafts };
      delete drafts[language];
      return { drafts };
    });
  }

  /** Version metadata, newest first. */
  async listVersions() {
    const { versions } = await this.#versionIndex.read();
    return [...versions].reverse();
  }

  async getVersion(id) {
    if (!VERSION_ID_PATTERN.test(id)) {
      return null;
    }

    const { versions } = await this.#versionIndex.read();
    const meta = versions.find((version) => version.id === id);
    if (!meta) {
      return null;
    }

    const content = JSON.parse(await readFile(join(this.#versionsDir, `${id}.json`), 'utf8'));
    return { ...meta, content };
  }

  async #recordVersion(language, content, savedAt, meta) {
    const id = `${savedAt.replace(/[:.]/g, '-')}-${randomBytes(3).toString('hex')}`;
    await mkdir(this.#versionsDir, { recursive: true });
    await writeFile(join(this.#versionsDir, `${id}.json`), JSON.stringify(content), 'utf8');

    const removed = [];
    await this.#versionIndex.update((index) => {
      index.versions.push({
        id,
        language,
        savedAt,
        savedBy: meta.username,
        ip: meta.ip ?? null,
        action: meta.action ?? 'save',
        ...(meta.restoredFrom ? { restoredFrom: meta.restoredFrom } : {})
      });
      // Keep the newest MAX_VERSIONS plus the last version of every day per language (daily checkpoints),
      // so a flood of saves cannot push out the states from previous days.
      const recentStart = Math.max(0, index.versions.length - MAX_VERSIONS);
      const dailyCheckpoints = new Map();
      for (const version of index.versions) {
        dailyCheckpoints.set(`${version.language}:${version.savedAt.slice(0, 10)}`, version.id);
      }
      const keep = new Set(dailyCheckpoints.values());

      index.versions = index.versions.filter((version, i) => {
        if (i >= recentStart || keep.has(version.id)) {
          return true;
        }
        removed.push(version);
        return false;
      });
      return index;
    });

    for (const version of removed) {
      await rm(join(this.#versionsDir, `${version.id}.json`), { force: true });
    }
  }
}
