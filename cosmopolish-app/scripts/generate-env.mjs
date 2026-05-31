import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const projectRoot = resolve(process.cwd());
const envCandidates = [
  resolve(projectRoot, '.env'),
  resolve(projectRoot, '.emv'),
  resolve(projectRoot, '..', '.env'),
  resolve(projectRoot, '..', '.emv')
];
const targetPath = resolve(projectRoot, 'src/environments/environment.ts');

const defaults = {
  ADMIN_USERNAME: '',
  ADMIN_PASSWORD: ''
};

function parseEnv(content) {
  const result = {};
  const normalizedContent = content.replace(/^\uFEFF/, '');

  for (const rawLine of normalizedContent.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    result[key] = value;
  }

  return result;
}

const resolvedEnvPath = envCandidates.find((candidate) => existsSync(candidate));
const parsed = resolvedEnvPath ? parseEnv(readFileSync(resolvedEnvPath, 'utf8')) : {};
const config = {
  ADMIN_USERNAME: parsed.ADMIN_USERNAME ?? defaults.ADMIN_USERNAME,
  ADMIN_PASSWORD: parsed.ADMIN_PASSWORD ?? defaults.ADMIN_PASSWORD
};

if (!resolvedEnvPath) {
  console.warn('No .env/.emv file found for admin credentials. Generated empty environment config.');
}

mkdirSync(dirname(targetPath), { recursive: true });

const fileContent = `export const environment = {
  production: true,
  adminUsername: ${JSON.stringify(config.ADMIN_USERNAME)},
  adminPassword: ${JSON.stringify(config.ADMIN_PASSWORD)}
};
`;

writeFileSync(targetPath, fileContent, 'utf8');
