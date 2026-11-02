import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { clientIp } from '../repositories/audit.js';
import { SUPPORTED_LANGUAGES, validateSiteContent } from '../validation/content.js';

export function contentRouter(deps) {
  const { content, audit } = deps;
  const router = Router();
  const auth = requireAuth(deps);

  // Public: the site reads its content from here. Languages never saved by an admin are absent,
  // and the frontend falls back to its built-in defaults for them.
  router.get('/', async (req, res) => {
    const data = await content.read();
    res.set('Cache-Control', 'no-cache');
    res.json(data);
  });

  router.get('/versions', auth, async (req, res) => {
    res.json({ versions: await content.listVersions() });
  });

  router.post('/versions/:id/restore', auth, async (req, res) => {
    const version = await content.getVersion(req.params.id);
    if (!version) {
      return res.status(404).json({ error: 'Version not found.' });
    }

    const saved = await content.saveLanguage(version.language, version.content, {
      username: req.user.username,
      ip: clientIp(req),
      action: 'restore',
      restoredFrom: version.id
    });
    audit.record('content.restore', {
      req,
      username: req.user.username,
      details: { language: version.language, versionId: version.id, versionSavedAt: version.savedAt }
    });
    res.json(saved);
  });

  router.put('/:language', auth, async (req, res) => {
    const { language } = req.params;
    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return res.status(404).json({ error: 'Unsupported language.' });
    }

    const validated = validateSiteContent(req.body);
    const saved = await content.saveLanguage(language, validated, {
      username: req.user.username,
      ip: clientIp(req),
      action: 'save'
    });
    audit.record('content.save', { req, username: req.user.username, details: { language } });
    res.json(saved);
  });

  return router;
}
