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

  // Drafts: unpublished edits autosaved by the admin panel, so a reload or closed tab loses nothing.
  // Not visible to the public and not written to the audit log (they are saved every few seconds).
  router.get('/drafts/:language', auth, supportedLanguage, async (req, res) => {
    res.json({ draft: await content.getDraft(req.params.language) });
  });

  router.put('/drafts/:language', auth, supportedLanguage, async (req, res) => {
    const validated = validateSiteContent(req.body);
    res.json({ draft: await content.saveDraft(req.params.language, validated, req.user.username) });
  });

  router.delete('/drafts/:language', auth, supportedLanguage, async (req, res) => {
    await content.deleteDraft(req.params.language);
    res.status(204).end();
  });

  router.put('/:language', auth, supportedLanguage, async (req, res) => {
    const { language } = req.params;

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

function supportedLanguage(req, res, next) {
  if (!SUPPORTED_LANGUAGES.includes(req.params.language)) {
    return res.status(404).json({ error: 'Unsupported language.' });
  }
  next();
}
