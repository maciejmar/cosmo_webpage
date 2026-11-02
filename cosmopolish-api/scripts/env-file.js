import { existsSync, readFileSync, writeFileSync } from 'node:fs';

/** Quotes a value for process.loadEnvFile with a quote character it does not contain. */
function quote(value) {
  if (/^[A-Za-z0-9_@.,:/+=-]*$/.test(value)) {
    return value;
  }

  const quoteChar = ['"', "'", '`'].find((candidate) => !value.includes(candidate) && !value.includes('\n'));
  if (!quoteChar) {
    throw new Error('Value contains all quote characters or a newline - set it manually in .env.');
  }
  return `${quoteChar}${value}${quoteChar}`;
}

/** Sets KEY=value lines in an .env file, replacing existing keys and appending new ones. */
export function setEnvValues(path, values) {
  const lines = existsSync(path) ? readFileSync(path, 'utf8').split(/\r?\n/) : [];

  for (const [key, value] of Object.entries(values)) {
    const line = `${key}=${quote(String(value))}`;
    const index = lines.findIndex((existing) => existing.startsWith(`${key}=`));
    if (index === -1) {
      if (lines.length && lines.at(-1) === '') {
        lines.splice(lines.length - 1, 0, line);
      } else {
        lines.push(line);
      }
    } else {
      lines[index] = line;
    }
  }

  writeFileSync(path, `${lines.join('\n').replace(/\n*$/, '')}\n`, { encoding: 'utf8', mode: 0o600 });
}
