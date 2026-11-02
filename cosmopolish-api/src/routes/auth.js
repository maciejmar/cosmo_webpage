import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { rateLimit } from 'express-rate-limit';
import { requireAuth, signToken } from '../middleware/auth.js';
import { clientIp } from '../repositories/audit.js';

export function authRouter(deps) {
  const { config, users, audit, notifier } = deps;
  const router = Router();

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: (req, res, next, options) => {
      audit.record('login.blocked', { req, details: { attemptedUsername: String(req.body?.username ?? '').slice(0, 100) } });
      res.status(options.statusCode).json({ error: 'Too many login attempts. Try again later.' });
    }
  });

  router.post('/login', loginLimiter, async (req, res) => {
    const { username, password } = req.body ?? {};
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const user = await users.verifyCredentials(username, password);
    if (!user) {
      audit.record('login.failed', { req, details: { attemptedUsername: username.slice(0, 100) } });
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const ip = clientIp(req);
    const isNewIp = await users.registerLoginIp(user.username, ip);
    audit.record('login.success', { req, username: user.username, details: { newIp: isNewIp } });

    if (isNewIp) {
      // Sent in the background - a mail server problem must not block logging in.
      notifier
        .loginFromNewIp({ username: user.username, ip, userAgent: req.get('user-agent'), at: new Date().toISOString() })
        .then((sent) => sent && audit.record('alert.sent', { username: user.username, details: { type: 'login-new-ip', ip } }))
        .catch((error) => {
          console.error('Login alert e-mail failed:', error);
          audit.record('alert.failed', { username: user.username, details: { type: 'login-new-ip', ip, error: error.message } });
        });
    }

    const token = signToken(user, config);
    const { exp } = jwt.decode(token);
    res.json({
      token,
      expiresAt: new Date(exp * 1000).toISOString(),
      user: { username: user.username, role: user.role }
    });
  });

  router.get('/me', requireAuth(deps), (req, res) => {
    res.json({ user: req.user });
  });

  return router;
}
