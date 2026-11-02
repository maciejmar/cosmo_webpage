import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

export function auditRouter(deps) {
  const { audit } = deps;
  const router = Router();

  router.get('/', requireAuth(deps), async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 1000);
    res.json({ events: await audit.list({ limit }) });
  });

  return router;
}
