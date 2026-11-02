import jwt from 'jsonwebtoken';

export function signToken(user, config) {
  return jwt.sign({ role: user.role }, config.jwtSecret, {
    algorithm: 'HS256',
    subject: user.username,
    expiresIn: config.jwtExpiresIn
  });
}

/**
 * Verifies the `Authorization: Bearer <jwt>` header and that the account still exists,
 * so removing an admin with `create-admin --remove` revokes their tokens immediately.
 */
export function requireAuth({ config, users }, role = 'admin') {
  return async (req, res, next) => {
    const header = req.get('authorization') ?? '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    let payload;
    try {
      payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    const user = await users.findByUsername(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'Account no longer exists.' });
    }
    if (user.role !== role) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    req.user = { username: user.username, role: user.role };
    next();
  };
}
