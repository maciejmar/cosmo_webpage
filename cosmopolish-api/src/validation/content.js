export const SUPPORTED_LANGUAGES = ['en', 'pl'];

const MAX_DEPTH = 8;
const MAX_STRING_LENGTH = 20_000;
const MAX_ARRAY_LENGTH = 500;
const MAX_KEYS = 100;
const KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;
// Uploaded images live under /uploads/, images shipped with the site under /assets/;
// everything else must be an absolute http(s) link.
const UPLOAD_PATH_PATTERN = /^\/(uploads|assets)\/[A-Za-z0-9_-][A-Za-z0-9._-]*$/;

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

function isUrlKey(key) {
  return /url$/i.test(key);
}

function validateUrl(value, path) {
  if (value === '' || UPLOAD_PATH_PATTERN.test(value)) {
    return value;
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new ValidationError(`${path}: invalid URL.`);
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new ValidationError(`${path}: only http(s) links or uploaded images are allowed.`);
  }
  return value;
}

/**
 * Generic validation of a content tree: plain objects, arrays, strings, numbers and booleans only,
 * with size limits. Every field whose name ends with "Url" (imageUrl, videoUrl, twitterUrl, ...)
 * must be an http(s) link or an uploaded image path - so `javascript:` or `data:` URLs never get stored.
 */
function sanitize(value, path, depth) {
  if (depth > MAX_DEPTH) {
    throw new ValidationError(`${path}: nesting too deep.`);
  }

  if (typeof value === 'string') {
    if (value.length > MAX_STRING_LENGTH) {
      throw new ValidationError(`${path}: text too long.`);
    }
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
    return value;
  }

  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_LENGTH) {
      throw new ValidationError(`${path}: too many items.`);
    }
    return value.map((item, index) => sanitize(item, `${path}[${index}]`, depth + 1));
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length > MAX_KEYS) {
      throw new ValidationError(`${path}: too many fields.`);
    }

    const result = {};
    for (const key of keys) {
      if (!KEY_PATTERN.test(key)) {
        throw new ValidationError(`${path}: invalid field name "${key}".`);
      }

      const childPath = `${path}.${key}`;
      const child = value[key];
      if (isUrlKey(key) && child !== null && child !== undefined) {
        if (typeof child !== 'string') {
          throw new ValidationError(`${childPath}: URL must be a string.`);
        }
        result[key] = validateUrl(child.trim(), childPath);
      } else {
        result[key] = sanitize(child, childPath, depth + 1);
      }
    }
    return result;
  }

  throw new ValidationError(`${path}: unsupported value.`);
}

export function validateSiteContent(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('Content must be a JSON object.');
  }
  return sanitize(body, 'content', 0);
}
