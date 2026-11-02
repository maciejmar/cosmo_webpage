import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';

const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

describe('CosmoPolish API', () => {
  let tempDir;
  let server;
  let baseUrl;
  let token;
  const sentMails = [];
  const auth = () => ({ authorization: `Bearer ${token}` });
  // The API trusts X-Forwarded-For from loopback, exactly like behind nginx.
  const fromIp = (ip) => ({ 'x-forwarded-for': ip });

  before(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'cosmopolish-api-'));
    const config = loadConfig({
      JWT_SECRET: 'test-secret-that-is-long-enough-for-hs256-signing',
      DATA_DIR: join(tempDir, 'data'),
      UPLOADS_DIR: join(tempDir, 'uploads'),
      SMTP_HOST: 'smtp.test',
      ALERT_EMAIL_TO: 'owner@example.com'
    });
    const mailTransport = { sendMail: async (message) => sentMails.push(message) };
    const { app, deps } = createApp(config, { mailTransport });
    await deps.users.upsert('Admin', 'correct-horse-battery');

    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    server?.close();
    await rm(tempDir, { recursive: true, force: true });
  });

  const json = (path, options = {}) =>
    fetch(`${baseUrl}${path}`, {
      ...options,
      headers: { 'content-type': 'application/json', ...options.headers }
    });

  it('rejects wrong credentials', async () => {
    const res = await json('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'wrong-password' })
    });
    assert.equal(res.status, 401);
  });

  it('logs in (username is case-insensitive) and returns a JWT', async () => {
    const res = await json('/api/auth/login', {
      method: 'POST',
      headers: fromIp('203.0.113.10'),
      body: JSON.stringify({ username: ' ADMIN ', password: 'correct-horse-battery' })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.token);
    assert.equal(body.user.username, 'admin');
    token = body.token;

    const me = await json('/api/auth/me', { headers: { authorization: `Bearer ${token}` } });
    assert.equal(me.status, 200);
  });

  it('protects content writes', async () => {
    const anonymous = await json('/api/content/pl', { method: 'PUT', body: '{}' });
    assert.equal(anonymous.status, 401);

    const forged = await json('/api/content/pl', {
      method: 'PUT',
      headers: { authorization: 'Bearer not.a.jwt' },
      body: '{}'
    });
    assert.equal(forged.status, 401);
  });

  it('saves content and serves it publicly', async () => {
    const content = {
      hero: { title: 'Test' },
      work: { items: [{ title: 'Film', imageUrl: '/uploads/a.jpg', videoUrl: 'https://youtu.be/x' }] }
    };
    const put = await json('/api/content/pl', {
      method: 'PUT',
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify(content)
    });
    assert.equal(put.status, 200);

    const get = await json('/api/content');
    const body = await get.json();
    assert.deepEqual(body.languages.pl, content);
    assert.equal(body.updatedBy, 'admin');
  });

  it('rejects dangerous URLs and unknown languages', async () => {
    const headers = { authorization: `Bearer ${token}` };
    for (const videoUrl of ['javascript:alert(1)', 'data:text/html,hi']) {
      const res = await json('/api/content/en', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ work: { items: [{ videoUrl }] } })
      });
      assert.equal(res.status, 400, videoUrl);
    }

    const res = await json('/api/content/de', { method: 'PUT', headers, body: '{}' });
    assert.equal(res.status, 404);
  });

  it('uploads images and rejects non-images', async () => {
    const upload = (buffer, name) => {
      const form = new FormData();
      form.append('image', new Blob([buffer]), name);
      return fetch(`${baseUrl}/api/uploads/images`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
        body: form
      });
    };

    const ok = await upload(PNG_1PX, 'pixel.png');
    assert.equal(ok.status, 201);
    const { url } = await ok.json();
    assert.match(url, /^\/uploads\/[\w-]+\.png$/);

    const served = await fetch(`${baseUrl}${url}`);
    assert.equal(served.status, 200);

    const bad = await upload(Buffer.from('<svg onload="alert(1)"></svg>'), 'evil.svg');
    assert.equal(bad.status, 415);
  });

  it('e-mails only on login from an IP the account has not used before', async () => {
    const login = (ip) =>
      json('/api/auth/login', {
        method: 'POST',
        headers: fromIp(ip),
        body: JSON.stringify({ username: 'admin', password: 'correct-horse-battery' })
      });

    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(sentMails.length, 1, 'first login (203.0.113.10) is a new IP');
    assert.match(sentMails[0].text, /203\.0\.113\.10/);
    assert.equal(sentMails[0].to, 'owner@example.com');

    await login('203.0.113.10');
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(sentMails.length, 1, 'same IP again - no e-mail');

    await login('198.51.100.7');
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(sentMails.length, 2, 'different IP - e-mail');
    assert.match(sentMails[1].subject, /admin/);
  });

  it('keeps versions and restores an earlier one', async () => {
    const save = (title) =>
      json('/api/content/en', {
        method: 'PUT',
        headers: { ...auth(), ...fromIp('203.0.113.10') },
        body: JSON.stringify({ hero: { title } })
      });
    await save('Good version');
    await save('Defaced by intruder');

    const listRes = await json('/api/content/versions', { headers: auth() });
    const { versions } = await listRes.json();
    const enVersions = versions.filter((version) => version.language === 'en');
    assert.equal(enVersions[0].savedBy, 'admin');
    assert.equal(enVersions[0].ip, '203.0.113.10');
    const good = enVersions[1];

    const restore = await json(`/api/content/versions/${good.id}/restore`, { method: 'POST', headers: auth() });
    assert.equal(restore.status, 200);
    const content = await (await json('/api/content')).json();
    assert.equal(content.languages.en.hero.title, 'Good version');

    const after = (await (await json('/api/content/versions', { headers: auth() })).json()).versions;
    assert.equal(after[0].action, 'restore');
    assert.equal(after[0].restoredFrom, good.id);

    const missing = await json('/api/content/versions/..%2Fusers/restore', { method: 'POST', headers: auth() });
    assert.equal(missing.status, 404);
    const anonymous = await json('/api/content/versions');
    assert.equal(anonymous.status, 401);
  });

  it('records an audit log with client IPs', async () => {
    await json('/api/auth/login', {
      method: 'POST',
      headers: fromIp('192.0.2.66'),
      body: JSON.stringify({ username: 'admin', password: 'guess-guess' })
    });
    await new Promise((resolve) => setTimeout(resolve, 20));

    const anonymous = await json('/api/audit');
    assert.equal(anonymous.status, 401);

    const { events } = await (await json('/api/audit?limit=500', { headers: auth() })).json();
    const failed = events.find((event) => event.event === 'login.failed');
    assert.equal(failed.ip, '192.0.2.66');
    assert.equal(failed.details.attemptedUsername, 'admin');

    const kinds = new Set(events.map((event) => event.event));
    for (const kind of ['login.success', 'content.save', 'content.restore', 'upload.image', 'alert.sent']) {
      assert.ok(kinds.has(kind), `missing ${kind}`);
    }
  });
});

describe('.env writer', () => {
  it('round-trips values with special characters', async () => {
    const { setEnvValues } = await import('../scripts/env-file.js');
    const { parseEnv } = await import('node:util');
    const { readFile, writeFile } = await import('node:fs/promises');
    const dir = await mkdtemp(join(tmpdir(), 'cosmopolish-env-'));
    const path = join(dir, '.env');
    await writeFile(path, 'PORT=3001\nSMTP_PASS=old\n');

    const values = {
      SMTP_PASS: `p@ss#w0rd$with"quotes'`,
      ALERT_EMAIL_TO: 'a@example.com,b@example.com',
      MAIL_FROM: 'CosmoPolish <alerts@example.com>'
    };
    setEnvValues(path, values);
    const parsed = parseEnv(await readFile(path, 'utf8'));

    assert.equal(parsed.PORT, '3001');
    for (const [key, value] of Object.entries(values)) {
      assert.equal(parsed[key], value, key);
    }
    await rm(dir, { recursive: true, force: true });
  });
});
